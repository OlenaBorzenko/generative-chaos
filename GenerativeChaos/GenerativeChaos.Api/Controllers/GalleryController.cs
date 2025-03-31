using GenerativeChaos.Api.Abstractions;
using Microsoft.AspNetCore.Mvc;

namespace GenerativeChaos.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GalleryController(IGalleryService galleryService) : Controller
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