using GenerativeChaos.Api.Abstractions;
using Microsoft.AspNetCore.Mvc;

namespace GenerativeChaos.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GalleryController(IGalleryService galleryService) : Controller
{
    [HttpPost]
    public async Task<IActionResult> SaveUserData([FromBody] string userInput)
    {
        try
        {
            var response = await galleryService.GenerateEmbeddingsAndSaveAsync(userInput);

            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Error saving user input", error = ex.Message });
        }
    }
    
    [HttpPost("{id}")]
    public async Task<IActionResult> GenerateDesignDetails(string id)
    {
        try
        {
            var response = await galleryService.GenerateDesignDetailsAsync(id);

            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = "Error generating design details", error = ex.Message });
        }
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
    
    [HttpGet("cache/{userInput}")]
    public async Task<IActionResult> SearchCachedDesigns(string userInput)
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