# Generative Chaos

Generative Chaos turns a short creative prompt into a configurable torus-knot artwork. An AI-powered .NET API creates an artistic description and shape parameters; a React and p5.js frontend renders the result, lets you adjust it, and exports 3D models. Designs can also be saved, explored in a gallery, and searched for similar results.

This is my art project and an evolving experiment. I also demo it at conferences as a concept—not as a production-ready or ideal solution.

## Project structure

- `frontend/torus-knot-visualizer/` — React, TypeScript, and p5.js app for generating, adjusting, viewing, and exporting artwork.
- `GenerativeChaos/GenerativeChaos.Api/` — ASP.NET Core API with AI-assisted generation, design and similarity search, and gallery services.

The API is designed to use Azure OpenAI, Azure Cosmos DB, and Azure Blob Storage.

Related shapes are matched by the meaning of the text prompt, not by comparing rendered geometry.
`Gallery:MinRelatedSimilarityScore` controls the minimum cosine similarity (default `0.6`);
raise it for stricter matches. `Gallery:DesignsMaxResults` is an upper limit, not a target:
unrelated designs are not used to fill empty slots. This is separate from `Gallery:CacheSimilarityScore`.

## Features

- Generate torus-knot artwork from a text prompt and explore related designs.
- Orbit, zoom, and pan around the 3D canvas; adjust parameters and export OBJ/FBX.
- Select up to four related designs and fuse them into a new saved design.
- Browse and page through generated designs in the gallery.
- Delete a gallery design using its delete button and confirmation. `DELETE /api/Gallery/designs/{designId}` returns `204` on success or `404` when the design is missing. Preview files are not deleted.

## Fusion API

`POST /api/Gallery/fusion` accepts a JSON request with the newly generated design ID, one to four similar design IDs, and optional guidance:

```json
{
  "newDesignId": "design-id",
  "similarDesignIds": ["source-id-1", "source-id-2"],
  "guidance": "Keep the first design's silhouette and use the second's surface rhythm."
}
```

The fused result is persisted like a generated design so its preview, adjustments, and gallery entry use the existing flows. Invalid or unknown source IDs return `400`.

## AI model configuration

The required `OpenAi:Endpoint`, `OpenAi:CompletionDeploymentName`, and `OpenAi:EmbeddingDeploymentName` values are configured outside the repository. Optional settings can be supplied through normal ASP.NET Core configuration or user-secrets:

| Key | Purpose |
|---|---|
| `OpenAi:FusionDeploymentName` | Optional fusion-specific deployment; defaults to the completion deployment. |
| `OpenAi:Temperature`, `OpenAi:TopP` | Optional sampling settings; omitted for reasoning deployments. |
| `OpenAi:MaxOutputTokens` | Optional output-token limit. |
| `OpenAi:ReasoningEffort` | Optional reasoning effort for compatible deployments. |
| `OpenAi:UseStructuredOutput` | Request JSON-object output for configuration/fusion responses. |

With these options unset, generation retains its existing model settings. See [AI model recommendations](docs/ai-model-recommendations.md) for deployment research and compatibility notes.

## Demo tips

- Generate a design, then drag over the artwork or use the camera controls to explore it.
- Select one to four related designs in the fusion panel; optional guidance can steer the synthesis.
- Use **Adjust** on either result to edit its parameters and export OBJ/FBX.
