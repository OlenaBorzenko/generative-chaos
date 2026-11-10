# Generative Chaos

Generative Chaos turns a short creative prompt into a configurable torus-knot artwork. An AI-powered .NET API creates an artistic description and shape parameters; a React and p5.js frontend renders the result, lets you adjust it, and exports 3D models. Designs can also be saved, explored in a gallery, and searched for similar results.

This is my art project and an evolving experiment. I also demo it at conferences as a concept—not as a production-ready or ideal solution.

## Project structure

- `frontend/torus-knot-visualizer/` — React, TypeScript, and p5.js app for generating, adjusting, viewing, and exporting artwork.
- `GenerativeChaos/GenerativeChaos.Api/` — ASP.NET Core API with AI-assisted generation, design and similarity search, and gallery services.

The API is designed to use Azure OpenAI, Azure Cosmos DB, and Azure Blob Storage.
