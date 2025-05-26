namespace GenerativeChaos.Api.Options;

public record FileStorage
{
    public required string ConnectionString { get; init; }

    public required string Container { get; init; }
}