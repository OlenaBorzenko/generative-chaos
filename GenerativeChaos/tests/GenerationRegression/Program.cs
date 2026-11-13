using System.Reflection;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Nodes;
using GenerativeChaos.Api;
using GenerativeChaos.Api.Dtos;
using GenerativeChaos.Api.Services;
using GenerativeChaos.Api.Abstractions;
using GenerativeChaos.Api.Controllers;
using Microsoft.AspNetCore.Mvc;

var service = (SemanticKernelService)RuntimeHelpers.GetUninitializedObject(typeof(SemanticKernelService));
var parse = typeof(SemanticKernelService).GetMethod("ParseConfig", BindingFlags.Instance | BindingFlags.NonPublic)!;
TorusConfig Parse(string json) => (TorusConfig)parse.Invoke(service, [json])!;
void Check(bool valid, string message)
{
    if (!valid) throw new Exception(message);
}
void Reject(string json)
{
    try { Parse(json); }
    catch (TargetInvocationException ex) when (ex.InnerException is JsonException) { return; }
    throw new Exception("Invalid output must not become a default design: " + json);
}

Reject("{}");
Reject("""{"description":"No configuration"}""");
Reject("not JSON");
var complete = JsonSerializer.SerializeToNode(Prompts.DefaultConfig)!.AsObject();
foreach (var field in complete.ToArray())
{
    var missing = complete.DeepClone().AsObject();
    missing.Remove(field.Key);
    Reject(missing.ToJsonString());
    var invalid = complete.DeepClone().AsObject();
    invalid[field.Key] = null;
    Reject(invalid.ToJsonString());
}

var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
var calm = Prompts.DefaultConfig with { P = 3, Q = 8, TwistTurns = 2, Lumps = 0 };
var storm = calm with { P = 4, Q = 7, TwistTurns = 40, Lumps = 25, EnableElectricity = true };
foreach (var config in new[] { calm, storm })
{
    var parsed = Parse("```json\n" + JsonSerializer.Serialize(config, options) + "\n```");
    Check(parsed.P == config.P && parsed.Q == config.Q, "Valid coprime topology must survive parsing.");
    Check(parsed.TwistTurns == config.TwistTurns && parsed.Lumps == config.Lumps,
        "Distinct model-generated parameters must survive parsing.");
}
var repaired = TorusConfigValidator.ValidateAndRepair(calm with { P = 4, Q = 8 }).Config;
Check(repaired.P < repaired.Q && Enumerable.Range(2, repaired.P - 1)
    .All(divisor => repaired.P % divisor != 0 || repaired.Q % divisor != 0),
    "Invalid topology must be repaired to a single knot.");
Console.WriteLine("Passed: incomplete output rejection, casing/fence parsing, parameter diversity, coprime topology repair.");

var galleryStub = new GalleryStub();
var controller = new GalleryController(galleryStub, null!);
Check(typeof(GalleryController).GetMethod(nameof(GalleryController.DeleteDesign))!
    .GetCustomAttribute<HttpDeleteAttribute>()?.Template == "designs/{designId}", "Delete route must include the design ID.");
Check(await controller.DeleteDesign("example") is NoContentResult && galleryStub.LastId == "example",
    "Successful delete must return 204 and pass the ID to the service.");
galleryStub.Exists = false;
Check(await controller.DeleteDesign("missing") is NotFoundObjectResult, "Missing design must return 404.");
galleryStub.Fail = true;
Check(await controller.DeleteDesign("error") is ObjectResult { StatusCode: 500 }, "Storage errors must return 500.");
Console.WriteLine("Passed: delete route, success, missing design and storage error.");

sealed class GalleryStub : IGalleryService
{
    public bool Exists { get; set; } = true;
    public bool Fail { get; set; }
    public string? LastId { get; set; }
    public Task<bool> DeleteDesignAsync(string id)
    {
        LastId = id;
        if (Fail) throw new InvalidOperationException("Storage unavailable");
        return Task.FromResult(Exists);
    }
    public Task<DesignDto> GenerateDesignAsync(string input) => throw new NotImplementedException();
    public Task<DesignDto> FuseDesignsAsync(FusionRequest request) => throw new NotImplementedException();
    public Task<List<DesignDto>> SearchSimilarDesignsAsync(string input) => throw new NotImplementedException();
    public Task<List<DesignDto>> GetDesignsPageAsync(int skip = 0, int take = 10) => throw new NotImplementedException();
    public Task UpdateDesignPreviewUrlAsync(string id, string url) => throw new NotImplementedException();
    public Task UpdateDesignConfigAsync(string id, TorusConfig config) => throw new NotImplementedException();
}
