namespace GenerativeChaos.Api.Options;

public record AzureStorage
{
    public required string ConnectionString { get; init; }

    public required string Container { get; init; }
}