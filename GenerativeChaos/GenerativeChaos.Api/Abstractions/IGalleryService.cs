using GenerativeChaos.Api.Dtos;

namespace GenerativeChaos.Api.Abstractions;

public interface IGalleryService
{
    Task<DesignDto> GenerateDesignAsync(string userInput);

    Task<List<DesignDto>> SearchSimilarDesignsAsync(string userInput);

    Task<List<DesignDto>> GetDesignsPageAsync();
}