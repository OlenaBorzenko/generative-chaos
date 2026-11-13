using GenerativeChaos.Api.Abstractions;
using GenerativeChaos.Api.Dtos;
using Microsoft.AspNetCore.Mvc;

namespace GenerativeChaos.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GalleryController(IGalleryService galleryService, IFileStorageService fileStorageService) : Controller
{
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

    [HttpPost("fusion")]
    public async Task<IActionResult> FuseDesigns([FromBody] FusionRequest request)
    {
        try
        {
            var response = await galleryService.FuseDesignsAsync(request);

            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Error fusing designs", error = ex.Message });
        }
    }
    
    [HttpPut("designs/{designId}")]
    public async Task<IActionResult> UpdateConfig(string designId, [FromBody] TorusConfig config)
    {
        await galleryService.UpdateDesignConfigAsync(designId, config);

        return Ok(new { message = "Config updated", designId });
    }

    [HttpDelete("designs/{designId}")]
    public async Task<IActionResult> DeleteDesign(string designId)
    {
        try
        {
            return await galleryService.DeleteDesignAsync(designId)
                ? NoContent()
                : NotFound(new { message = "Design not found" });
        }
        catch (Exception)
        {
            return StatusCode(500, new { message = "Error deleting design" });
        }
    }
    
    [HttpPost("preview/{designId}")]
    public async Task<IActionResult> UploadPreview(string designId, IFormFile image)
    {
        if (image == null || image.Length == 0)
            return BadRequest("No file uploaded");

        await using var stream = image.OpenReadStream();
        var url = await fileStorageService.UploadFileAsync($"{designId}.png", stream);

        await galleryService.UpdateDesignPreviewUrlAsync(designId, url);

        return Ok(new { message = "Preview uploaded", url });
    }

    [HttpGet("previews")]
    public async Task<IActionResult> GetPreviews([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var pagedFiles = await fileStorageService.GetFilesAsync(page, pageSize);
        return Ok(pagedFiles);
    }
   
    [HttpGet]
    public async Task<IActionResult> GetDesignsPage([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            int skip = (page - 1) * pageSize;
            int take = pageSize;
            var response = await galleryService.GetDesignsPageAsync(skip, take);

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
