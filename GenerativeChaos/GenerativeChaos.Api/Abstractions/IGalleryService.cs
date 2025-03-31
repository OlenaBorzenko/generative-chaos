using GenerativeChaos.Api.Models;

namespace GenerativeChaos.Api.Abstractions;

public interface IGalleryService
{
    Task<string> GenerateEmbeddingsAndSaveAsync(string designObject);

    Task<TorusConfig> GenerateDesignDetailsAsync(string designId);

    Task<List<Design>> SearchSimilarDesignsAsync(string userInput);

    Task<List<Design>> GetDesignsPageAsync();
}