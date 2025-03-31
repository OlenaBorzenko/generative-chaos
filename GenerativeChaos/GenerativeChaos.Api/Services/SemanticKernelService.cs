using System.Text.Json;
using GenerativeChaos.Api.Models;
using GenerativeChaos.Api.Options;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.VectorData;
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.Connectors.AzureCosmosDBNoSQL;
using Microsoft.SemanticKernel.Embeddings;
using OpenAI;
using Design = GenerativeChaos.Api.Models.Design;

namespace GenerativeChaos.Api.Services;

public class SemanticKernelService
{
    readonly Kernel kernel;

    private readonly AzureCosmosDBNoSQLVectorStoreRecordCollection<Design> _designContainer;

    public SemanticKernelService(OpenAIClient openAiClient, CosmosClient cosmosClient, IOptions<OpenAi> openAiOptions, IOptions<CosmosDb> cosmosOptions)
    {
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
        var descriptionFunction = kernel.CreateFunctionFromPrompt(Prompts.DesignDescriptionPromptTemplate);
        var descriptionResult = await kernel.InvokeAsync(descriptionFunction, new KernelArguments { ["prompt"] = userInput });

        var description = descriptionResult.ToString();
        var configFunction = kernel.CreateFunctionFromPrompt(Prompts.DesignConfigurationPromptTemplate);
        var configResult = await kernel.InvokeAsync(configFunction, new KernelArguments { ["$description"] = description });

        var artConfig = Prompts.DefaultConfig;
        
        try
        {
            var options = new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            };
            
            var output = JsonSerializer.Deserialize<TorusConfig>(configResult.ToString(), options);
            artConfig = output ?? artConfig;
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
        }
        
        return (description, artConfig);
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
