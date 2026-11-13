using System.Net;
using System.Text.Json;
using GenerativeChaos.Api.Abstractions;
using GenerativeChaos.Api.Dtos;
using GenerativeChaos.Api.Models;
using GenerativeChaos.Api.Options;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace GenerativeChaos.Api.Services;

public class GalleryService : IGalleryService
{
    private const int MinSimilarDesigns = 1;
    private const int MaxSimilarDesigns = 4;

    private readonly CosmosDbService _cosmosDbService;
    private readonly SemanticKernelService _semanticKernelService;
    private readonly int _designsMaxResults;
    private readonly double _minRelatedSimilarityScore;
    
    public GalleryService(CosmosDbService cosmosDbService, SemanticKernelService semanticKernelService, IOptions<Gallery> chatOptions)
    {
        _cosmosDbService = cosmosDbService;
        _semanticKernelService = semanticKernelService;
        _minRelatedSimilarityScore = chatOptions.Value.MinRelatedSimilarityScore;

        var designsMaxResults = chatOptions.Value.DesignsMaxResults;

        _designsMaxResults = int.TryParse(designsMaxResults, out _designsMaxResults) ? _designsMaxResults: 10;
    }
    
    public async Task<DesignDto> GenerateDesignAsync(string userInput)
    {
        var embeddings = await _semanticKernelService.GetEmbeddingsAsync(userInput);
        
        var (description, config) = await _semanticKernelService.GenerateDesignConfigurationAsync(userInput);
        
        var serialisedConfig = JsonSerializer.Serialize(config);
        
        var design = new Design(userInput, embeddings, description, serialisedConfig);
        
        await _cosmosDbService.InsertDesignAsync(design);

        return new DesignDto
        {
            id = design.id, 
            Description = design.GeneratedDescription,
            TorusConfig = config,
            UserInput = design.UserInput
        };
    }

    public async Task<DesignDto> FuseDesignsAsync(FusionRequest request)
    {
        var sourceIds = ValidateFusionRequest(request);

        Design[] sources;
        try
        {
            sources = await Task.WhenAll(sourceIds.Select(_cosmosDbService.GetDesignAsync));
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            throw new ArgumentException("One or more fusion source IDs were not found.", nameof(request), ex);
        }

        var (description, config) = await _semanticKernelService.FuseDesignConfigurationsAsync(sources, request.Guidance);

        if (string.IsNullOrWhiteSpace(description))
            description = sources[0].GeneratedDescription ?? sources[0].UserInput;

        var embeddings = await _semanticKernelService.GetEmbeddingsAsync(description);
        var userInput = $"Fusion: {string.Join(" + ", sources.Select(source => source.UserInput))}";
        var design = new Design(userInput, embeddings, description, JsonSerializer.Serialize(config))
        {
            FusedFrom = sourceIds
        };
        await _cosmosDbService.InsertDesignAsync(design);

        return new DesignDto
        {
            id = design.id,
            UserInput = design.UserInput,
            Description = description,
            TorusConfig = config,
            FusedFrom = design.FusedFrom
        };
    }

    private static string[] ValidateFusionRequest(FusionRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(request.NewDesignId)
            || request.SimilarDesignIds is not { Count: >= MinSimilarDesigns and <= MaxSimilarDesigns }
            || request.SimilarDesignIds.Any(string.IsNullOrWhiteSpace))
        {
            throw new ArgumentException($"Provide a new design ID and between {MinSimilarDesigns} and {MaxSimilarDesigns} selected design IDs.");
        }

        var sourceIds = new[] { request.NewDesignId }.Concat(request.SimilarDesignIds).ToArray();
        if (sourceIds.Distinct(StringComparer.Ordinal).Count() != sourceIds.Length)
        {
            throw new ArgumentException("Fusion source IDs must be distinct.");
        }

        return sourceIds;
    }

    public async Task<List<DesignDto>> SearchSimilarDesignsAsync(string userInput)
    {
        var vectors = await _semanticKernelService.GetEmbeddingsAsync(userInput);
        
        var similarItems = await _cosmosDbService.GetSimilarAsync(vectors, _minRelatedSimilarityScore, _designsMaxResults);

        return similarItems.Select(x => new DesignDto
        {
            id = x.id,
            Description = x.GeneratedDescription,
            PreviewUrl = x.PreviewUrl,
            TorusConfig = JsonSerializer.Deserialize<TorusConfig>(x.TorusConfig),
            UserInput = x.UserInput,
            FusedFrom = x.FusedFrom
        }).ToList();
    }

    public async Task<List<DesignDto>> GetDesignsPageAsync(int skip = 0, int take = 10)
    {
        var designs = await _cosmosDbService.GetDesignsRangeAsync(skip, take);

        return designs.Select(x => new DesignDto
        {
            id = x.id,
            PreviewUrl = x.PreviewUrl,
            Description = x.GeneratedDescription,
            TorusConfig = JsonSerializer.Deserialize<TorusConfig>(x.TorusConfig),
            UserInput = x.UserInput,
            FusedFrom = x.FusedFrom
        }).ToList();
    }

    public async Task UpdateDesignPreviewUrlAsync(string designId, string url)
    {
        var design = await _cosmosDbService.GetDesignAsync(designId);

        design.PreviewUrl = url;

        await _cosmosDbService.UpdateDesignAsync(design);
    }

    public async Task<bool> DeleteDesignAsync(string designId)
    {
        try
        {
            await _cosmosDbService.DeleteDesignAsync(designId);
            return true;
        }
        catch (CosmosException ex) when (ex.StatusCode == HttpStatusCode.NotFound)
        {
            return false;
        }
    }

    public async Task UpdateDesignConfigAsync(string designId, TorusConfig config)
    {
        var design = await _cosmosDbService.GetDesignAsync(designId);

        design.TorusConfig = JsonSerializer.Serialize(config);

        await _cosmosDbService.UpdateDesignAsync(design);
    }
}
