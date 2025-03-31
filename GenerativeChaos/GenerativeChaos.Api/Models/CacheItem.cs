namespace GenerativeChaos.Api.Models;

public class CacheItem
{
    public string Id { get; set; }
    public string UserInput { get; set; }
    
    public string? GeneratedDescription { get; set; }
    
    public string? TorusConfig { get; set; }
    public ReadOnlyMemory<float> Vectors { get; set; }

    public CacheItem(string userInput, string? generatedDescription, ReadOnlyMemory<float> vectors, string torusConfig)
    {
        Id = Guid.NewGuid().ToString();
        UserInput = userInput;
        GeneratedDescription = generatedDescription;
        Vectors = vectors;
        TorusConfig = torusConfig;
    }
}