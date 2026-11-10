namespace GenerativeChaos.Api.Options;

public record CosmosDb
{
    public required string Endpoint { get; init; }
    
    public required string Database { get; init; }
    
    public required string DesignContainer { get; init; }
}