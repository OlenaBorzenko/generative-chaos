using Azure.Storage.Blobs;
using GenerativeChaos.Api.Abstractions;
using Microsoft.AspNetCore.Mvc;

namespace GenerativeChaos.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GalleryController(IGalleryService galleryService, BlobServiceClient blobServiceClient) : Controller
{
    private readonly string _containerName = "previews";
    
    [HttpPost]
    public async Task<IActionResult> GenerateDesign([FromBody] string userInput)
    {
        try
        {
            var response = await galleryService.GenerateDesignAsync(userInput);

            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Error generating design details", error = ex.Message });
        }
    }
    
    [HttpPost("preview/{designId}")]
    public async Task<IActionResult> UploadPreview(string designId, IFormFile image)
    {
        if (image == null || image.Length == 0)
            return BadRequest("No file uploaded");

        var container = blobServiceClient.GetBlobContainerClient(_containerName);
        await container.CreateIfNotExistsAsync();

        var blobClient = container.GetBlobClient($"{designId}.png");
        await using var stream = image.OpenReadStream();
        await blobClient.UploadAsync(stream, overwrite: true);

        return Ok(new { message = "Preview uploaded", url = blobClient.Uri });
    }
    
    [HttpGet]
    public async Task<IActionResult> GetDesignsPage()
    {
        try
        {
            var response = await galleryService.GetDesignsPageAsync();

            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Error getting designs", error = ex.Message });
        }
    }
    
    [HttpGet("similar/{userInput}")]
    public async Task<IActionResult> SearchSimilarDesigns(string userInput)
    {
        try
        {
            var response = await galleryService.SearchSimilarDesignsAsync(userInput);

            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Error finding similar desings", error = ex.Message });
        }
    }
}