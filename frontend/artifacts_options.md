# Artifact Retention Beyond 90 Days: Storage Options Overview

## Context

The current challenge is that build artifacts are automatically cleaned up after 90 days. To ensure long-term availability, we are exploring alternative storage or publishing mechanisms.

## Options Under Consideration

| Option | Description | Pros | Cons | Recommended Use Case |
|--------|-------------|------|------|-----------------------|
| **SharePoint** | Store artifacts (e.g., ZIPs, installers) in a document library | - Easy to share<br>- Integrated with M365<br>- Good for manual access | - Limited automation<br>- Poor versioning support<br>- Not ideal for large binaries | Internal teams manually downloading non-sensitive files |
| **S3 Bucket** | Store artifacts in AWS S3 with versioning and lifecycle rules | - Highly durable<br>- Lifecycle policies<br>- Scalable<br>- API access | - Requires AWS setup<br>- Additional cost<br>- Permissions management | Long-term archival and integration with pipelines |
| **Attach to Release** | Include artifacts in GitHub Releases (or Azure DevOps Releases) | - Integrated into release lifecycle<br>- Easy to track<br>- Visible in deployment history | - Still subject to retention policy if not overridden<br>- Manual step needed in pipeline | Production deployment packages or versioned installers |
| **Custom NuGet Feed (Azure Artifacts or Self-hosted)** | Publish versioned libraries as NuGet packages | - Built-in retention settings<br>- Good for internal libraries<br>- Integrated with build pipelines | - Not suitable for all artifact types<br>- Requires package consumers to support NuGet | Internal SDKs, shared libraries, CLI tools |
| **Azure Blob Storage** | Store files with full control over retention, access, and versioning | - Highly scalable<br>- Cost-efficient<br>- Full automation<br>- Fine-grained access control | - Requires setup and policies<br>- External sharing needs SAS tokens or signed URLs | Long-term archiving, external distribution, large files |

## Recommendations

- Use **Azure Blob Storage** or **S3 Bucket** for scalable, long-term, automated storage.
- For internal library use, consider **Azure Artifacts** with NuGet.
- For production releases or external distribution, **GitHub Releases**.
- Avoid **SharePoint** for large or frequently updated artifacts.
