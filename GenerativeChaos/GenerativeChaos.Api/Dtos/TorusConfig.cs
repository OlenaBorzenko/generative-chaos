namespace GenerativeChaos.Api.Dtos;

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