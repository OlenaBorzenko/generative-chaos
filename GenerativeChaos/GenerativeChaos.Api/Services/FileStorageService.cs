using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using GenerativeChaos.Api.Abstractions;
using GenerativeChaos.Api.Options;
using Microsoft.Extensions.Options;

namespace GenerativeChaos.Api.Services;

public class FileStorageService : IFileStorageService
{
    private readonly BlobContainerClient _container;

    public FileStorageService(BlobServiceClient blobServiceClient, IOptions<FileStorage> openAiOptions)
    {
        var containerName = openAiOptions.Value.Container;
        _container = blobServiceClient.GetBlobContainerClient(containerName);
        _container.CreateIfNotExists(PublicAccessType.Blob);
    }

    public async Task<string> UploadFileAsync(string fileName, Stream fileStream)
    {
        var blobClient = _container.GetBlobClient(fileName);
        await blobClient.UploadAsync(fileStream, overwrite: true);

        return blobClient.Uri.ToString();
    }

    public async Task<List<string>> GetFilesAsync(int page, int pageSize)
    {
        var blobs = _container.GetBlobsAsync();

        var allBlobs = new List<string>();
        await foreach (var blob in blobs)
        {
            var uri = _container.GetBlobClient(blob.Name).Uri.ToString();
            allBlobs.Add(uri);
        }

        return allBlobs
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();
    }
}