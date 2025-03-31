using GenerativeChaos.Api.Models;

namespace GenerativeChaos.Api;

public static class Prompts
{
    public const string DesignDescriptionPromptTemplate = @"
        You're an assistant that transforms creative art prompts into vivid, artistic visual descriptions for generative artwork based on torus knot geometry.
        The user provides a short input or concept, such as a mood, shape, emotion or other.
        You elaborate it into a short (1–3 sentence) artistic vision.
        The output should mention visual form (e.g., structure, flow), style influences (if relevant), and color/emotion.
        Focus on describing the overall look and feel, not technical parameters. Input: {{$prompt}}";
    
    public const string DesignConfigurationPromptTemplate = @"You are an assistant that transforms artistic visual descriptions into valid torus knot configurations for generative art.
        The configuration will be used to render a 2D wireframe visualization of a 3D torus knot using the p5.js library. 
        Your job is to generate a balanced, visually pleasing configuration in strict JSON format, following the schema and constraints below.
        Ensure all values are valid, visually harmonious, and within the allowed ranges.

        ---

        Color Guidance:
        Act as a color theory expert. Generate thoughtful and creative combinations.
        - fillColor should reflect the **dominant tone** from the input description.
        - bgColor must **contrast with the fillColor** to make the shape stand out.
        - wireColor must have **strong contrast with fillColor** for wireframe visibility.
        - Use rgb() or rgba() format as specified.

        ---

        Additional Rules:
        - p and q must be **prime numbers**, not equal, and p < q
        - twistDirection must be **exactly 1 or -1** (negative often gives elegant folds)
        - Adjust values to avoid shape overlap or deformation:
          - If knotRadius > 0.9, reduce tubeRadius
          - If waveAmplitude > 0.5, keep tubeRadius < 0.2
          - If lumps > 30, keep lumpHeight < 1

        ---

        Schema:
        { 
          p: integer (prime, ≤ 10),
          q: integer (prime, ≤ 15, q ≠ p), 
          ringDetail: integer (10–40), 
          pathDetail: integer (200–600),
          tubeRadius: float (0.05–0.25), 
          knotRadius: float (0.4–1.2), 
          waveAmplitude: float (0.2–0.7),
          eccentricity: float (0–1),
          twistTurns: integer (0–60), 
          globalTwistTurns: float (0–30), 
          twistDirection: -1 or 1,
          lumps: integer (0–40), 
          lumpHeight: float (0–1.5), 
          lumpOffset: float (0–1),
          enableElectricity: boolean, 
          electricityStrength: float (0–0.3), 
          electricityFreq: integer (1–20),
          bgColor: string (format: 'rgb(r, g, b)'), 
          fillColor: string (format: 'rgba(r, g, b, a)'), 
          wireColor: string (format: 'rgb(r, g, b)') 
        }

        InputDescription: {{$description}}

        Output ONLY the JSON object, with no explanation or commentary. Your output should start with '{' and end with '}'.";
    
    public static TorusConfig DefaultConfig = new()
    {
            P = 3,
            Q = 8,
            RingDetail = 20,
            PathDetail = 400,
    
            TubeRadius = 0.15f,
            KnotRadius = 0.85f,
            WaveAmplitude = 0.45f,

            Eccentricity = 0.6f,

            TwistTurns = 20,
            GlobalTwistTurns = 16.5f,
            TwistDirection = -1,

            Lumps = 10,
            LumpHeight = 0.9f,
            LumpOffset = 0.0f,

            EnableElectricity = false,
            ElectricityStrength = 0.15f,
            ElectricityFreq = 2,

            BgColor = "rgb(20, 10, 40)",
            FillColor = "rgba(255, 100, 0, 90)",
            WireColor = "rgb(255, 255, 255)"
        };
}