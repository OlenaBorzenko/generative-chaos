using System.Text.Json;
using GenerativeChaos.Api.Abstractions;
using GenerativeChaos.Api.Dtos;
using GenerativeChaos.Api.Models;
using GenerativeChaos.Api.Options;
using Microsoft.Extensions.Options;

namespace GenerativeChaos.Api.Services;

public class GalleryService : IGalleryService
{
    private readonly CosmosDbService _cosmosDbService;
    private readonly SemanticKernelService _semanticKernelService;
    private readonly double _similarityScore;
    private readonly int _designsMaxResults;
    
    public GalleryService(CosmosDbService cosmosDbService, SemanticKernelService semanticKernelService, IOptions<Gallery> chatOptions)
    {
        _cosmosDbService = cosmosDbService;
        _semanticKernelService = semanticKernelService;

        var similarityScore = chatOptions.Value.CacheSimilarityScore;
        var designsMaxResults = chatOptions.Value.DesignsMaxResults;

        _similarityScore = double.TryParse(similarityScore, out _similarityScore) ? _similarityScore : 0.65;
        _designsMaxResults = int.TryParse(designsMaxResults, out _designsMaxResults) ? _designsMaxResults: 10;
    }
    
    public async Task<TorusConfig> GenerateDesignAsync(string userInput)
    {
        var embeddings = await _semanticKernelService.GetEmbeddingsAsync(userInput);
        
        var (description, config) = await _semanticKernelService.GenerateDesignConfigurationAsync(userInput);
        
        config.EnableElectricity = false;
        config.LumpOffset = 0;
        
        var serialisedConfig = JsonSerializer.Serialize(config);
        
        var design = new Design(userInput, embeddings, description, serialisedConfig);
        
        await _cosmosDbService.InsertDesignAsync(design);

        return config;
    }

    public async Task<List<DesignDto>> SearchSimilarDesignsAsync(string userInput)
    {
        var vectors = await _semanticKernelService.GetEmbeddingsAsync(userInput);
        
        var cacheItems = await _cosmosDbService.GetSimilarAsync(vectors, _similarityScore);

        return cacheItems.Select(x => new DesignDto
        {
            id = x.id, 
            Description = x.GeneratedDescription,
            TorusConfig = JsonSerializer.Deserialize<TorusConfig>(x.TorusConfig),
            UserInput = x.UserInput
        }).ToList();
    }

    public async Task<List<DesignDto>> GetDesignsPageAsync()
    {
        var designs = await _cosmosDbService.GetDesignsAsync();
        
        return designs.Select(x => new DesignDto
        {
            id = x.id, 
            Description = x.GeneratedDescription,
            TorusConfig = JsonSerializer.Deserialize<TorusConfig>(x.TorusConfig),
            UserInput = x.UserInput
        }).ToList();;
    }
}