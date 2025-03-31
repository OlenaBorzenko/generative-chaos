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
    public string? TorusConfig { get; set; }

    [VectorStoreRecordVector(Dimensions: 1536, DistanceFunction: DistanceFunction.CosineSimilarity, IndexKind: IndexKind.DiskAnn)]
    public ReadOnlyMemory<float> Vectors { get; set; }

    public Design(string userInput, ReadOnlyMemory<float> vectors, string? generatedDescription = null, string? torusConfig = null)
    {
        id = Guid.NewGuid().ToString();
        UserInput = userInput;
        GeneratedDescription = generatedDescription;
        Vectors = vectors;
        TorusConfig = torusConfig;
    }
}

public record TorusConfig
{
    public int P { get; init; }
    public int Q { get; init; }
    public int RingDetail { get; init; }
    public int PathDetail { get; init; }

    public double TubeRadius { get; init; }
    public double KnotRadius { get; init; }
    public double WaveAmplitude { get; init; }

    public double Eccentricity { get; init; }

    public double TwistTurns { get; init; }
    public double GlobalTwistTurns { get; init; }
    public int TwistDirection { get; init; }

    public int Lumps { get; init; }
    public double LumpHeight { get; init; }
    public double LumpOffset { get; init; }

    public bool EnableElectricity { get; init; }
    public double ElectricityStrength { get; init; }
    public int ElectricityFreq { get; init; }

    public string BgColor { get; init; }
    public string FillColor { get; init; }
    public string WireColor { get; init; }
}