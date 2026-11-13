using GenerativeChaos.Api.Dtos;

namespace GenerativeChaos.Api.Abstractions;

public interface IGalleryService
{
    Task<DesignDto> GenerateDesignAsync(string userInput);

    Task<DesignDto> FuseDesignsAsync(FusionRequest request);

    Task<List<DesignDto>> SearchSimilarDesignsAsync(string userInput);

    Task<List<DesignDto>> GetDesignsPageAsync(int skip = 0, int take = 10);

    Task<bool> DeleteDesignAsync(string designId);
    
    Task UpdateDesignPreviewUrlAsync(string designId, string url);
    
    Task UpdateDesignConfigAsync(string designId, TorusConfig config);
}