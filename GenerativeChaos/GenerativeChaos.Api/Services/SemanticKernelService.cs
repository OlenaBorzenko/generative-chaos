using System.Text.Json;
using System.Text.Json.Nodes;
using GenerativeChaos.Api.Dtos;
using GenerativeChaos.Api.Options;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.VectorData;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.AzureCosmosDBNoSQL;
using Microsoft.SemanticKernel.Connectors.OpenAI;
using Microsoft.SemanticKernel.Embeddings;
using OpenAI;
using Design = GenerativeChaos.Api.Models.Design;

namespace GenerativeChaos.Api.Services;

public class SemanticKernelService
{
    readonly Kernel kernel;

    private const string FusionServiceId = "fusion";
    private readonly OpenAi _openAi;

    private readonly AzureCosmosDBNoSQLVectorStoreRecordCollection<Design> _designContainer;

    public SemanticKernelService(OpenAIClient openAiClient, CosmosClient cosmosClient, IOptions<OpenAi> openAiOptions, IOptions<CosmosDb> cosmosOptions)
    {
        _openAi = openAiOptions.Value;
        var completionDeploymentName = openAiOptions.Value.CompletionDeploymentName;
        var embeddingDeploymentName = openAiOptions.Value.EmbeddingDeploymentName;

        var databaseName = cosmosOptions.Value.Database;
        var designContainerName = cosmosOptions.Value.DesignContainer;

        ArgumentException.ThrowIfNullOrEmpty(completionDeploymentName);
        ArgumentException.ThrowIfNullOrEmpty(embeddingDeploymentName);
        ArgumentException.ThrowIfNullOrEmpty(databaseName);
        ArgumentException.ThrowIfNullOrEmpty(designContainerName);

        var builder = Kernel.CreateBuilder();

        builder.AddOpenAIChatCompletion(modelId: completionDeploymentName, openAIClient: openAiClient);

        if (!string.IsNullOrWhiteSpace(_openAi.FusionDeploymentName))
        {
            builder.AddOpenAIChatCompletion(modelId: _openAi.FusionDeploymentName, openAIClient: openAiClient, serviceId: FusionServiceId);
        }

        builder.AddOpenAITextEmbeddingGeneration(embeddingDeploymentName, openAiClient, dimensions: 1536);

        builder.Services.AddSingleton<Database>(_ => cosmosClient.GetDatabase(databaseName));
        
        var options = new AzureCosmosDBNoSQLVectorStoreRecordCollectionOptions<Design> { PartitionKeyPropertyName = "id" };
        builder.AddAzureCosmosDBNoSQLVectorStoreRecordCollection(designContainerName, options);

        kernel = builder.Build();

        _designContainer = (AzureCosmosDBNoSQLVectorStoreRecordCollection<Design>)kernel.Services
            .GetRequiredService<IVectorStoreRecordCollection<string, Design>>();
    }
   
    public async Task<float[]> GetEmbeddingsAsync(string text)
    {
        try
        {
            var embeddings = await kernel.GetRequiredService<ITextEmbeddingGenerationService>()
                .GenerateEmbeddingAsync(text);

            var embeddingsArray = embeddings.ToArray();

            return embeddingsArray;
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            throw;
        }
    }
    
    public async Task<(string, TorusConfig)> GenerateDesignConfigurationAsync(string userInput)
    {
        var descriptionSettings = CreateExecutionSettings(temperature: 0.8);
        var descriptionFunction = kernel.CreateFunctionFromPrompt(
            Prompts.DesignDescriptionPromptTemplate,
            executionSettings: descriptionSettings);
            
        var descriptionResult = await kernel.InvokeAsync(descriptionFunction, new KernelArguments { ["prompt"] = userInput });

        var description = descriptionResult.ToString();
        var configSettings = CreateExecutionSettings(jsonOutput: true, temperature: 0.7);
        var configFunction = kernel.CreateFunctionFromPrompt(
            Prompts.DesignConfigurationPromptTemplate,
            executionSettings: configSettings);
        var arguments = new KernelArguments
        {
            ["description"] = description,
            ["prompt"] = userInput
        };
        for (var attempt = 0; attempt < 2; attempt++)
        {
            var configResult = await kernel.InvokeAsync(configFunction, arguments);
            try
            {
                return (description, ParseConfig(configResult.ToString()));
            }
            catch (JsonException) when (attempt == 0)
            {
                Console.WriteLine("Invalid generated configuration; retrying with the complete schema.");
            }
        }

        throw new JsonException("The model did not return a complete valid design configuration.");
    }

    private OpenAIPromptExecutionSettings CreateExecutionSettings(bool fusion = false, bool jsonOutput = false, double? temperature = null)
    {
        var useFusion = fusion && !string.IsNullOrWhiteSpace(_openAi.FusionDeploymentName);
        var deployment = useFusion ? _openAi.FusionDeploymentName! : _openAi.CompletionDeploymentName;

        var settings = new OpenAIPromptExecutionSettings();
        if (useFusion) settings.ServiceId = FusionServiceId;

        var isReasoning = !string.IsNullOrWhiteSpace(_openAi.ReasoningEffort) || IsReasoningDeployment(deployment);
        if (!isReasoning)
        {
            settings.Temperature = _openAi.Temperature ?? temperature;
            settings.TopP = _openAi.TopP;
        }

        if (!string.IsNullOrWhiteSpace(_openAi.ReasoningEffort)) settings.ReasoningEffort = _openAi.ReasoningEffort;
        if (_openAi.MaxOutputTokens is { } max) settings.MaxTokens = max;
        if (jsonOutput && _openAi.UseStructuredOutput == true) settings.ResponseFormat = "json_object";

        return settings;
    }

    private static bool IsReasoningDeployment(string name)
        => name.StartsWith("o", StringComparison.OrdinalIgnoreCase) && name.Length > 1 && char.IsDigit(name[1])
           || name.StartsWith("gpt-5", StringComparison.OrdinalIgnoreCase);

    private TorusConfig ParseConfig(string json)
    {
        var objectJson = ExtractFirstJsonObject(json);
        var parsedNode = JsonNode.Parse(objectJson) as JsonObject
            ?? throw new JsonException("The generated config JSON must be an object.");
        var mergedNode = new JsonObject();
        var schema = JsonSerializer.SerializeToNode(Prompts.DefaultConfig)!.AsObject();

        foreach (var field in schema)
        {
            var property = parsedNode.FirstOrDefault(pair =>
                string.Equals(pair.Key, field.Key, StringComparison.OrdinalIgnoreCase));
            if (!IsCompatibleJsonKind(field.Value?.GetValueKind(), property.Value?.GetValueKind()))
            {
                throw new JsonException($"The generated configuration has a missing or invalid '{field.Key}' field.");
            }

            mergedNode[field.Key] = property.Value!.DeepClone();
        }

        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var candidate = mergedNode.Deserialize<TorusConfig>(options)
            ?? throw new JsonException("The generated config JSON could not be deserialized.");
        var (config, fixes) = TorusConfigValidator.ValidateAndRepair(candidate);
        foreach (var fix in fixes)
        {
            Console.WriteLine($"Torus config repair: {fix}");
        }

        return config;
    }

    private static bool IsCompatibleJsonKind(JsonValueKind? expected, JsonValueKind? actual)
        => expected switch
           {
               JsonValueKind.Number => actual == JsonValueKind.Number,
               JsonValueKind.String => actual == JsonValueKind.String,
               JsonValueKind.True or JsonValueKind.False => actual is JsonValueKind.True or JsonValueKind.False,
               _ => false
           };

    private static string ExtractFirstJsonObject(string text)
    {
        var start = text.IndexOf('{');
        if (start < 0)
        {
            throw new JsonException("The model response did not contain a JSON object.");
        }

        var depth = 0;
        var inString = false;
        var escaped = false;
        for (var index = start; index < text.Length; index++)
        {
            var character = text[index];
            if (inString)
            {
                if (escaped)
                {
                    escaped = false;
                }
                else if (character == '\\')
                {
                    escaped = true;
                }
                else if (character == '"')
                {
                    inString = false;
                }

                continue;
            }

            if (character == '"')
            {
                inString = true;
            }
            else if (character == '{')
            {
                depth++;
            }
            else if (character == '}' && --depth == 0)
            {
                return text[start..(index + 1)];
            }
        }

        throw new JsonException("The model response contained an incomplete JSON object.");
    }

    public async Task<(string description, TorusConfig config)> FuseDesignConfigurationsAsync(
        IReadOnlyList<Design> sources, string? guidance)
    {
        var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
        var sourceJson = JsonSerializer.Serialize(sources.Select(source => new
        {
            userInput = source.UserInput,
            description = source.GeneratedDescription,
            config = JsonSerializer.Deserialize<TorusConfig>(source.TorusConfig ?? "null", options)
                ?? throw new JsonException($"Design '{source.id}' has no configuration.")
        }));
        var settings = CreateExecutionSettings(fusion: true, jsonOutput: true, temperature: 0.7);
        var function = kernel.CreateFunctionFromPrompt(Prompts.FusionPromptTemplate);
        var result = await kernel.InvokeAsync(function, new KernelArguments(settings)
        {
            ["sources"] = sourceJson,
            ["schema"] = Prompts.ConfigurationRules,
            ["guidance"] = string.IsNullOrWhiteSpace(guidance)
                ? "Synthesize a distinctive design that inherits recognizable traits from every source."
                : guidance
        });

        using var document = JsonDocument.Parse(ExtractFirstJsonObject(result.ToString()));
        var root = document.RootElement;
        var descriptionProperty = root.EnumerateObject()
            .FirstOrDefault(property => property.Name.Equals("description", StringComparison.OrdinalIgnoreCase));
        var configProperty = root.EnumerateObject()
            .FirstOrDefault(property => property.Name.Equals("config", StringComparison.OrdinalIgnoreCase));
        if (descriptionProperty.Value.ValueKind != JsonValueKind.String
            || string.IsNullOrWhiteSpace(descriptionProperty.Value.GetString())
            || configProperty.Value.ValueKind != JsonValueKind.Object)
        {
            throw new JsonException("Fusion output must contain a description and a configuration object.");
        }

        return (descriptionProperty.Value.GetString()!, ParseConfig(configProperty.Value.GetRawText()));
    }

    public async Task<List<Design>> SearchDesignsAsync(ReadOnlyMemory<float> vectors, int designsMaxResults)
    {
        var options = new VectorSearchOptions<Design>
        {
            VectorProperty = design => design.Vectors,
            Top = designsMaxResults
        };

        var searchResult = await _designContainer.VectorizedSearchAsync(vectors, options);

        var resultRecords = new List<VectorSearchResult<Design>>();
        
        await foreach (var result in searchResult.Results)
        {
            resultRecords.Add(result);
        }

        List<Design> designs = [];
        designs.AddRange(resultRecords.Select(r => r.Record));
        
        return designs;
    }
}
