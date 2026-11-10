namespace GenerativeChaos.Api.Abstractions;

public interface IFileStorageService
{
    Task<string> UploadFileAsync(string fileName, Stream fileStream);
    Task<List<string>> GetFilesAsync(int page, int pageSize);
}