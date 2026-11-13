using GenerativeChaos.Api.Models;
using GenerativeChaos.Api.Options;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Options;

namespace GenerativeChaos.Api.Services;

public class CosmosDbService
{
    private readonly Container _cacheContainer;
    private readonly Container _designContainer;
    
    public CosmosDbService(CosmosClient client, IOptions<CosmosDb> options)
    {
        var databaseName = options.Value.Database;
        var designContainerName = options.Value.DesignContainer;
        
        ArgumentException.ThrowIfNullOrEmpty(databaseName);
        ArgumentException.ThrowIfNullOrEmpty(designContainerName);
        
        var database = client.GetDatabase(databaseName)!;
        var designContainer = database.GetContainer(designContainerName)!;
        
        _designContainer = designContainer 
                           ?? throw new ArgumentException("Unable to connect to existing Azure Cosmos DB container or database.");
    }
    
    private static PartitionKey GetPK(string id)
    {
        // Add better partitioning
        return new PartitionKeyBuilder().Add(id).Build();
    }
    
    public async Task<Design> InsertDesignAsync(Design design)
    {
        try
        {
            return await _designContainer.CreateItemAsync(design, GetPK(design.id));
        }
        catch (Exception e)
        {
            Console.WriteLine(e);
            throw;
        }
    }

    public async Task<Design> GetDesignAsync(string id)
    {
        return await _designContainer.ReadItemAsync<Design>(id, GetPK(id));
    }

    public async Task UpdateDesignAsync(Design design)
    {
        await _designContainer.ReplaceItemAsync(
            item: design,
            id: design.id,
            partitionKey: GetPK(design.id)
        );
    }

    public async Task DeleteDesignAsync(string id)
    {
        await _designContainer.DeleteItemAsync<Design>(id, GetPK(id));
    }

    public async Task<List<Design>> GetSimilarAsync(ReadOnlyMemory<float> vectors, double minSimilarityScore, int take = 10)
    {
        if (!double.IsFinite(minSimilarityScore) || minSimilarityScore is < -1 or > 1)
            throw new ArgumentOutOfRangeException(nameof(minSimilarityScore), "Cosine similarity must be between -1 and 1.");

        var result = new List<Design>();

        const string queryText = $"""
                                  SELECT TOP @take
                                      c.id, c.userInput, c.generatedDescription, c.torusConfig, c.previewUrl, c.fusedFrom
                                  FROM c
                                  WHERE VectorDistance(c.vectors, @vectors) >= @minSimilarityScore
                                  ORDER BY 
                                      VectorDistance(c.vectors, @vectors)
                                  """;

        var queryDef = new QueryDefinition(query: queryText)
            .WithParameter("@vectors", vectors.ToArray())
            .WithParameter("@minSimilarityScore", minSimilarityScore)
            .WithParameter("@take", Math.Clamp(take, 1, 100));

        using FeedIterator<Design> resultSet = _designContainer.GetItemQueryIterator<Design>(queryDef);

        while (resultSet.HasMoreResults)
        {
            var response = await resultSet.ReadNextAsync();

            result.AddRange(response);
        }

        return result;
    }

    public async Task<List<Design>> GetDesignsRangeAsync(int skip, int take)
    {
        var queryText = $@"
            SELECT c.id, c.userInput, c.torusConfig, c.generatedDescription, c.previewUrl
            FROM c
            ORDER BY c._ts DESC
            OFFSET {skip} LIMIT {take}
        ";

        var query = _designContainer.GetItemQueryIterator<Design>(queryText);

        var results = new List<Design>();

        while (query.HasMoreResults)
        {
            var response = await query.ReadNextAsync();
            results.AddRange(response);
        }

        return results;
    }
}
