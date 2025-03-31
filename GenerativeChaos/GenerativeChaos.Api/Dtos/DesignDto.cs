namespace GenerativeChaos.Api.Dtos;

public record DesignDto
{
    public required string id { get; set; }
    
    public required string UserInput { get; set; }
    
    public string? Description { get; set; }
    
    public TorusConfig? TorusConfig { get; set; }
}