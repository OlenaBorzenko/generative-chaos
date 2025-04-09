using System.Text.Json;
using Azure.Identity;
using Azure.Storage.Blobs;
using GenerativeChaos.Api;
using GenerativeChaos.Api.Abstractions;
using Microsoft.Extensions.Options;
using GenerativeChaos.Api.Options;
using GenerativeChaos.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.RegisterConfiguration();

var cosmosEndpoint = builder.Configuration.GetSection(nameof(CosmosDb)).GetValue<string>("Endpoint");
if (cosmosEndpoint is null)
{
    throw new ArgumentException($"{nameof(IOptions<CosmosDb>)} was not resolved through dependency injection.");
}
builder.AddAzureCosmosClient(
    "generative-chaos-cosmos",
    settings =>
    {
        settings.AccountEndpoint = new Uri(cosmosEndpoint);
        settings.Credential = new DefaultAzureCredential();
        settings.DisableTracing = false;
    },
    clientOptions => {
        clientOptions.ApplicationName = "generative-chaos-cosmos";
        clientOptions.UseSystemTextJsonSerializerWithOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };
    });

var openAIEndpoint = builder.Configuration.GetSection(nameof(OpenAi)).GetValue<string>("Endpoint");
if (openAIEndpoint is null)
{
    throw new ArgumentException($"{nameof(IOptions<OpenAi>)} was not resolved through dependency injection.");
}

builder.Services.AddSingleton<BlobServiceClient>(sp =>
{
    var options = sp.GetRequiredService<IOptions<AzureStorage>>().Value;
    return new BlobServiceClient(options.ConnectionString);
});

builder.AddAzureOpenAIClient("openAiConnectionName",
    configureSettings: settings =>
    {
        settings.Endpoint = new Uri(openAIEndpoint);
        settings.Credential = new DefaultAzureCredential();
    });

builder.Services.RegisterServices();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseHttpsRedirection();
app.MapControllers();

await app.RunAsync();


namespace GenerativeChaos.Api
{
    static class ProgramExtensions
    {
        public static void RegisterConfiguration(this WebApplicationBuilder builder)
        {
            builder.Services.AddOptions<CosmosDb>()
                .Bind(builder.Configuration.GetSection(nameof(CosmosDb)));
            
            builder.Services.AddOptions<AzureStorage>()
                .Bind(builder.Configuration.GetSection(nameof(AzureStorage)));

            builder.Services.AddOptions<OpenAi>()
                .Bind(builder.Configuration.GetSection(nameof(OpenAi)));

            builder.Services.AddOptions<Gallery>()
                .Bind(builder.Configuration.GetSection(nameof(Gallery)));
        }

        public static void RegisterServices(this IServiceCollection services)
        {
            services.AddSingleton<SemanticKernelService, SemanticKernelService>();
            services.AddSingleton<CosmosDbService, CosmosDbService>();
            services.AddScoped<IGalleryService, GalleryService>();
        }
    }
}