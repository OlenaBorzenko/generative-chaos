using System.Text.Json;
using GenerativeChaos.Api.Abstractions;
using GenerativeChaos.Api.Models;
using GenerativeChaos.Api.Options;
using Microsoft.Extensions.Options;

namespace GenerativeChaos.Api.Services;

public class GalleryService : IGalleryService
{
    private readonly CosmosDbService _cosmosDbService;
    private readonly SemanticKernelService _semanticKernelService;
    private readonly double _cacheSimilarityScore;
    private readonly int _designsMaxResults;
    
    public GalleryService(CosmosDbService cosmosDbService, SemanticKernelService semanticKernelService, IOptions<Gallery> chatOptions)
    {
        _cosmosDbService = cosmosDbService;
        _semanticKernelService = semanticKernelService;

        var cacheSimilarityScore = chatOptions.Value.CacheSimilarityScore;
        var designsMaxResults = chatOptions.Value.DesignsMaxResults;

        _cacheSimilarityScore = double.TryParse(cacheSimilarityScore, out _cacheSimilarityScore) ? _cacheSimilarityScore : 0.95;
        _designsMaxResults = int.TryParse(designsMaxResults, out _designsMaxResults) ? _designsMaxResults: 10;
    }
    
    public async Task<string> GenerateEmbeddingsAndSaveAsync(string userInput)
    {
        var embeddings = await _semanticKernelService.GetEmbeddingsAsync(userInput);

        var design = await _cosmosDbService.InsertDesignAsync(new Design(userInput, embeddings));
        
        return design.id;
    }
    
    public async Task<TorusConfig> GenerateDesignDetailsAsync(string designId)
    {
        var design = await _cosmosDbService.GetDesignAsync(designId);
        
        var (description, config) = await _semanticKernelService.GenerateDesignConfigurationAsync(design.UserInput);
        
        var serialisedConfig = JsonSerializer.Serialize(config);
        
        design.GeneratedDescription = description;
        design.TorusConfig = serialisedConfig;
        
        await _cosmosDbService.UpdateDesignAsync(design);

        return config;
    }

    public async Task<List<Design>> SearchSimilarDesignsAsync(string userInput)
    {
        var vectors = await _semanticKernelService.GetEmbeddingsAsync(userInput);
        
        var cacheItems = await _cosmosDbService.GetCacheAsync(vectors, _cacheSimilarityScore);

        return cacheItems;
    }

    public async Task<List<Design>> GetDesignsPageAsync()
    {
        return await _cosmosDbService.GetDesignsAsync();
    }
}