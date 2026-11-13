# AI Model Recommendations (WS-D)

Research date: 2026-11-12. Sources are Microsoft Learn pages (last updated Oct 2026) plus third-party price aggregators. **Verify before the demo** – catalog and prices change monthly, and the official pricing page is JavaScript-rendered, so I could not extract official per-token rates programmatically.

## 1. Baseline

The current deployment name lives in `OpenAi:CompletionDeploymentName` (user-secrets / external config). **Not inspected; model identity is unknown.** Confirm in the Azure portal or Foundry before comparing. Code uses `AddOpenAIChatCompletion(modelId: <deployment>, openAIClient)` with the Chat Completions API (SK 1.44.0, `Azure.AI.OpenAI 2.2.0-beta.4`).

## 2. Candidates

Context/capability data: [Foundry Models sold by Azure](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure) (updated 2026-10-29). Regions: [Region availability, Global Standard, Americas](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure-region-availability) (updated 2026-10-19). Prices (USD per 1M tokens, Global Standard) are from third-party aggregators ([azurespeed](https://www.azurespeed.com/AzureAiModelPricing), [pricepertoken](https://pricepertoken.com/endpoints/azure), [inference.net](https://inference.net/content/azure-openai-pricing-explained/)) and are **unverified against the official [Azure pricing page](https://azure.microsoft.com/en-us/pricing/details/ai-foundry-models/aoai/)**. "n/a" = not found.

| Model (version) | Kind | Structured outputs | Chat Completions | Context / max out | Price in / out | Global Standard regions (Americas) | Notes |
|---|---|---|---|---|---|---|---|
| gpt-4.1 (2025-04-14) | non-reasoning | yes (JSON schema) | yes | n/a in sources fetched | ~$2.00 / ~$8.00 | all but canadacentral | Temperature/top_p work; fast; older generation |
| gpt-4.1-mini (2025-04-14) | non-reasoning | yes | yes | n/a | ~$0.40 / ~$1.60 | all but canadacentral | Cheap, low latency |
| o4-mini (2025-04-16) | reasoning | n/a | yes | n/a | n/a | all but canadacentral | Older o-series; temp/top_p unsupported |
| gpt-5 / 5-mini (2025-08-07) | reasoning | n/a | n/a | n/a | n/a | all but canadacentral | Superseded by 5.x |
| gpt-5.1 (2025-11-13) | reasoning | yes | yes | 400k (272k in/128k out) | n/a | all 10 | |
| gpt-5.4-mini (2026-03-17) | reasoning | yes | yes | 400k (272k/128k) | ~$0.75 in; out n/a | all 10 | Good fast fallback |
| gpt-5.4-nano (2026-03-17) | reasoning | yes | yes | 400k | n/a | all 10 | |
| gpt-5.5 (2026-04-24) | reasoning | yes | yes | 1.05M (922k in/128k out) | ~$5 / ~$30 | all 10 | Quota request needed on some tiers |
| gpt-5.6-sol/terra/luna (2026-07-09) | reasoning | yes | yes, **but not with function tools unless `reasoning_effort=none`** | 1.05M | n/a | all 10 | Short/long-context pricing tiers |
| gpt-6-luna (2026-09-22) | reasoning | yes | yes | 1.05M (922k/128k) | ~$0.10 / ~$0.50 (aggregator, treat skeptically) | all 10 | Reasoning effort + verbosity; quota request may be needed |
| gpt-6-sol / gpt-6-astra | reasoning | yes | yes | 1.05M | n/a | all 10 | Astra may add safety controls (see docs) |
| gpt-6.1-terra (2026-10-26) | reasoning | yes | yes | 1.05M | ~$1.00 / ~$5.00 | all except eastus2 | Newest, ~2 weeks old |
| gpt-6.1-sol (2026-09-29) | reasoning | yes | yes | 1.05M | n/a | all 10 | Flagship tier |
| gpt-chat-latest | **Preview** | yes | yes | 128k | n/a | all 10 | Not for production; moving target |

Deployment types: Global/Data Zone/Regional Standard (pay-per-token), Provisioned, Batch ([region availability page](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure-region-availability)). Only the Americas Global Standard table was reviewed; EU/APAC/MEA were not. GA vs Preview: only `gpt-chat-latest` is explicitly marked Preview in the fetched page; the page did not mark others GA/Preview per row, so "GA" is inferred from the absence of a Preview label. Gemini/Claude/other-provider catalog entries were not evaluated.

Qualitative criteria (math/geometry reasoning, creative variety, latency) are **not benchmarked here** – no reliable cited source was gathered. Reasoning models generally help with coprime p/q rules and range heuristics; non-reasoning models are faster and permit temperature for variety. Run the WS-E 10-prompt set against the shortlisted deployments to decide empirically.

## 3. Recommendation

- **Primary (quality, fusion step):** `gpt-5.5` (stable since April, 6+ months of GA, wide regions, structured outputs) – or `gpt-6.1-terra` if you accept a two-week-old model and its region gap (not eastus2). Set `ReasoningEffort` to `low`/`medium` to keep latency sane.
- **Fast demo fallback (description + config generation):** `gpt-4.1-mini` if still available in your region (lowest latency, supports temperature for variety), else `gpt-5.4-mini` with `ReasoningEffort: low`.
- Suggested split: keep `CompletionDeploymentName` fast; set `FusionDeploymentName` to the primary.
- Deployment names in secrets are arbitrary; set the deployment name to start with the model name (e.g. `gpt-5.5`) so reasoning auto-detection works, or set `ReasoningEffort` explicitly.
- Check quota: GPT-5.5/5.6/6 may require a quota request unless the subscription is Tier 5/6 ([models page](https://learn.microsoft.com/en-us/azure/foundry/foundry-models/concepts/models-sold-directly-by-azure)).

## 4. Configuration (no deploy needed)

All optional under `OpenAi` in `appsettings.json` / user-secrets / env (`OpenAi__Temperature`). Absent = prior behavior.

| Key | Effect |
|---|---|
| `FusionDeploymentName` | Registers a second keyed chat service (`fusion`); fusion calls use it, else completion deployment |
| `Temperature`, `TopP` | Override per-call temperature / top_p; **omitted for reasoning models** |
| `MaxOutputTokens` | Sets `max_tokens` (SDK sends `max_completion_tokens`) |
| `ReasoningEffort` | `low`/`medium`/`high` (newer values such as `none`/`minimal` depend on SDK enum support – untested) |
| `UseStructuredOutput` | `true` → `response_format=json_object` on JSON calls (config, fusion) |

Reasoning model detection: `ReasoningEffort` set, or deployment name starting with `o<digit>` or `gpt-5`. **Gap:** `gpt-6*` names are not auto-detected – set `ReasoningEffort` or `Temperature` carefully (code change would be one line in `IsReasoningDeployment`). Reasoning models reject temperature/top_p.

Implementation: `Options/OpenAi.cs`, `Services/SemanticKernelService.cs` (ctor + `CreateExecutionSettings(bool fusion, bool jsonOutput, double? temperature)`). Only JSON-object mode is implemented; full JSON-schema mode is not (would need newer SK/SDK validation).

## 5. SK 1.44 compatibility risk (no package updates made)

Current versions (`GenerativeChaos.Api.csproj`): `Microsoft.SemanticKernel 1.44.0`, `Azure.AI.OpenAI 2.2.0-beta.4`, `Aspire.Azure.AI.OpenAI 9.1.0-preview.1.25121.10`, `Connectors.AzureCosmosDBNoSQL 1.44.0-preview`.

- Verified: `OpenAIPromptExecutionSettings.ReasoningEffort`, `MaxTokens`, `ResponseFormat` compile against 1.44; solution builds.
- Risk (inferred, **not tested against a live deployment**): SK 1.44 and the 2.2-beta SDK predate GPT-5.x/6.x. Possible issues: `reasoning_effort` values added later (`none`, `minimal`, `xhigh`) may not be representable; `verbosity` not exposed; `max_tokens` vs `max_completion_tokens` mapping; GPT-5.6 Chat Completions + tools restriction (we use no tools, so OK). Responses-API-only models (e.g. gpt-5.1-codex, gpt-5.4-pro) cannot be used via the chat connector – avoid them.
- If a live smoke test fails with 400 errors, options: drop the unsupported setting, pick an older reasoning model (gpt-5.1/5.4-mini), or request approval to bump SK/Azure.AI.OpenAI.

## 6. Open items

- Confirm baseline deployment/model and region (secrets deliberately not read).
- Confirm official prices on the Azure pricing page / calculator; table prices are aggregator-sourced.
- Smoke-test chosen deployment with a real request, including `json_object` and `ReasoningEffort`.
- Check retirement schedule: [model retirements](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirement-schedule) (not reviewed for gpt-4.1/o4-mini).
