using GenerativeChaos.Api.Dtos;

namespace GenerativeChaos.Api;

public static class Prompts
{
    public const string FusionPromptTemplate = @"
        You are a generative-art director creating a genuinely new torus-knot artwork by fusing source designs.
        For every source, inspect its geometric signature: p/q topology, silhouette and radial breathing,
        twist direction and spiral rhythm, beading/lumps, surface flattening, jitter, and palette.
        Synthesize rather than average: inherit topology from one source, rhythm or surface character from
        another, and blend or deliberately contrast their palettes. The result should read as a coherent,
        distinctive new design—not a copy of one source and not an arithmetic midpoint.
        Treat guidance as a creative constraint when provided. Keep the description to 1–3 sentences and
        explain the synthesized visual character, not the source list.

        Sources (JSON array of userInput, description, and config): {{$sources}}
        Guidance: {{$guidance}}
        Configuration rules and complete schema (apply to the nested config, not the top-level response):
        {{$schema}}

        Return only a JSON object with exactly these top-level keys:
        { ""description"": ""... "", ""config"": { ...valid TorusConfig fields... } }
        Do not include markdown, comments, or additional top-level properties.";

    public const string DesignDescriptionPromptTemplate = @"
        Turn the user's idea into a concise, structured art direction brief for a torus-knot artwork.
        In 1–3 sentences, clearly convey (1) topology and silhouette, (2) movement/rhythm, (3) complexity
        and surface texture, (4) energy or mood, and (5) a color palette with its dominant and accent tones.
        Make concrete, visual choices while preserving the user's intent; do not mention numeric parameters,
        JSON, or implementation details. Input: {{$prompt}}";
    
    public const string ConfigurationRules = @"You are an assistant that transforms artistic visual descriptions into valid torus knot configurations for generative art.
        Map the art-direction brief to the TorusConfig schema below. The artwork is a 3D knot rendered as a
        2D wireframe; choose a coherent, distinctive design that can be plotted clearly.

        Parameter semantics:
        - p and q define the knot topology: p is the number of lobes/windings around the axis, q is the
          number of passes through the torus hole. They must be coprime (no common divisor) and p < q.
        - waveAmplitude controls radial breathing; eccentricity flattens the tube into a ribbon.
        - twistTurns controls local spiral motion; globalTwistTurns adds a broader winding.
        - lumps and lumpHeight control the number and prominence of beads along the path.
        - enableElectricity/electricityStrength/electricityFreq add high-frequency jitter.

        Example valid p/q pairs: (2,3), (2,5), (3,4), (3,7), (3,8), (4,5),
        (4,7), (5,6), (5,9), (7,10), (8,13), (9,14), (10,13).
        Other coprime pairs within the schema ranges are also valid; these are not presets.

        Translate mood and motion into parameter choices:
        - Calm, meditative, or flowing: low twistTurns and lumps, gentle radial breathing, no electricity.
        - Chaotic, stormy, or electric: consider higher q, stronger twist, and restrained visible jitter.
        - Organic, cellular, or baroque: use expressive lumps and moderate eccentricity.
        - Minimal or delicate: reduce twist, lumps, waveAmplitude, and surface detail.
        Match the brief rather than applying these as rigid presets.

        Avoid repetition: do not default to p=3,q=8 or copy the default config. Consider several valid
        topologies and parameter combinations internally, then select the most distinctive one that fits
        the brief. Vary topology, silhouette, rhythm, and palette across unrelated prompts.

        Plotter-aware density: pathDetail × ringDetail is the approximate wire/mesh workload. Keep the
        product at or below 16,000; use moderate detail for complex or jittered designs and avoid spending
        detail where the visual effect is already busy.

        Colors: fillColor is the dominant body color; bgColor must contrast with it; wireColor must remain
        clearly visible against the body and background. Aim for an internal 60/30/10 balance of dominant,
        secondary, and accent colors. Use only valid CSS rgb(r, g, b) for bgColor and wireColor, and
        rgba(r, g, b, a) for fillColor; integer channels are 0–255 and alpha is a decimal from 0 to 1.

        Geometry constraints:
        - twistDirection is exactly -1 or 1.
        - If knotRadius > 0.9, keep tubeRadius <= 0.15.
        - If waveAmplitude > 0.5, keep tubeRadius < 0.2.
        - If lumps > 30, keep lumpHeight < 1.

        Schema (include every field):
        {
          ""p"": integer (2–10), ""q"": integer (3–15, q > p, coprime to p),
          ""ringDetail"": integer (10–40), ""pathDetail"": integer (200–600),
          ""tubeRadius"": number (0.05–0.25), ""knotRadius"": number (0.4–1.2),
          ""waveAmplitude"": number (0.2–0.7), ""eccentricity"": number (0–1),
          ""twistTurns"": number (0–60), ""globalTwistTurns"": number (0–30),
          ""twistDirection"": -1 or 1, ""lumps"": integer (0–40),
          ""lumpHeight"": number (0–1.5), ""lumpOffset"": number (0–1),
          ""enableElectricity"": boolean, ""electricityStrength"": number (0–0.3),
          ""electricityFreq"": integer (1–20), ""bgColor"": string,
          ""fillColor"": string, ""wireColor"": string
        }";

    public const string DesignConfigurationPromptTemplate = ConfigurationRules + @"
        Original user request: {{$prompt}}
        Art-direction brief: {{$description}}

        Output only the JSON object, with no explanation or markdown.";
    
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
            FillColor = "rgba(255, 100, 0, 0.9)",
            WireColor = "rgb(255, 255, 255)"
        };
}