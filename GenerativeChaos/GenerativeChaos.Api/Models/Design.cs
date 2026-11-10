using Microsoft.Extensions.VectorData;

namespace GenerativeChaos.Api.Models;

public class Design
{
    [VectorStoreRecordKey]
    public string id { get; set; }
    
    [VectorStoreRecordData]
    public string UserInput { get; set; }
    
    [VectorStoreRecordData]
    public string? GeneratedDescription { get; set; }
    
    [VectorStoreRecordData]
    public string? PreviewUrl { get; set; }
    
    [VectorStoreRecordData]
    public string? TorusConfig { get; set; }

    [VectorStoreRecordVector(Dimensions: 1536, DistanceFunction: DistanceFunction.CosineSimilarity, IndexKind: IndexKind.DiskAnn)]
    public ReadOnlyMemory<float> Vectors { get; set; }

    public Design(string userInput, ReadOnlyMemory<float> vectors, string? generatedDescription = null, string? torusConfig = null, string? previewUrl = null)
    {
        id = Guid.NewGuid().ToString();
        UserInput = userInput;
        GeneratedDescription = generatedDescription;
        Vectors = vectors;
        PreviewUrl = previewUrl;
        TorusConfig = torusConfig;
    }
}