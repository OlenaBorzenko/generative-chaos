using System.Globalization;
using System.Text.RegularExpressions;
using GenerativeChaos.Api.Dtos;

namespace GenerativeChaos.Api.Services;

public static class TorusConfigValidator
{
    private const int MaxDetailBudget = 16_000;

    private static readonly (int P, int Q)[] ValidTopologyPairs =
        (from p in Enumerable.Range(2, 9)
         from q in Enumerable.Range(p + 1, 15 - p)
         where GreatestCommonDivisor(p, q) == 1
         select (p, q)).ToArray();

    private static readonly Regex ColorPattern = new(
        @"^\s*rgba?\(\s*(?<r>[+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*(?<g>[+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*,\s*(?<b>[+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:\s*,\s*(?<a>[+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*)?\)\s*$",
        RegexOptions.IgnoreCase | RegexOptions.CultureInvariant);

    public static (TorusConfig Config, IReadOnlyList<string> Fixes) ValidateAndRepair(TorusConfig? input)
    {
        var fixes = new List<string>();
        var config = input ?? Prompts.DefaultConfig;
        if (input is null)
        {
            fixes.Add("Configuration was missing; used defaults.");
        }

        var p = ClampInteger(config.P, 2, 10, Prompts.DefaultConfig.P, "p", fixes);
        var q = ClampInteger(config.Q, 2, 15, Prompts.DefaultConfig.Q, "q", fixes);
        if (p >= q || GreatestCommonDivisor(p, q) != 1)
        {
            var pair = ValidTopologyPairs
                .OrderBy(candidate => Math.Abs(candidate.P - p) + Math.Abs(candidate.Q - q))
                .ThenBy(candidate => candidate.P)
                .ThenBy(candidate => candidate.Q)
                .First();
            p = pair.P;
            q = pair.Q;
            fixes.Add($"Replaced invalid topology with the valid coprime pair p={p}, q={q}.");
        }

        var ringDetail = ClampInteger(config.RingDetail, 10, 40, Prompts.DefaultConfig.RingDetail, "ringDetail", fixes);
        var pathDetail = ClampInteger(config.PathDetail, 200, 600, Prompts.DefaultConfig.PathDetail, "pathDetail", fixes);
        var maxPathDetail = Math.Max(200, MaxDetailBudget / ringDetail);
        if (pathDetail > maxPathDetail)
        {
            pathDetail = maxPathDetail;
            fixes.Add($"Reduced pathDetail to {pathDetail} to keep pathDetail × ringDetail at or below {MaxDetailBudget}.");
        }

        var tubeRadius = ClampNumber(config.TubeRadius, 0.05, 0.25, Prompts.DefaultConfig.TubeRadius, "tubeRadius", fixes);
        var knotRadius = ClampNumber(config.KnotRadius, 0.4, 1.2, Prompts.DefaultConfig.KnotRadius, "knotRadius", fixes);
        var waveAmplitude = ClampNumber(config.WaveAmplitude, 0.2, 0.7, Prompts.DefaultConfig.WaveAmplitude, "waveAmplitude", fixes);
        var eccentricity = ClampNumber(config.Eccentricity, 0, 1, Prompts.DefaultConfig.Eccentricity, "eccentricity", fixes);
        var twistTurns = ClampNumber(config.TwistTurns, 0, 60, Prompts.DefaultConfig.TwistTurns, "twistTurns", fixes);
        var globalTwistTurns = ClampNumber(config.GlobalTwistTurns, 0, 30, Prompts.DefaultConfig.GlobalTwistTurns, "globalTwistTurns", fixes);
        var twistDirection = config.TwistDirection is -1 or 1
            ? config.TwistDirection
            : RepairValue("twistDirection", Prompts.DefaultConfig.TwistDirection, fixes);
        var lumps = ClampInteger(config.Lumps, 0, 40, Prompts.DefaultConfig.Lumps, "lumps", fixes);
        var lumpHeight = ClampNumber(config.LumpHeight, 0, 1.5, Prompts.DefaultConfig.LumpHeight, "lumpHeight", fixes);
        var lumpOffset = ClampNumber(config.LumpOffset, 0, 1, Prompts.DefaultConfig.LumpOffset, "lumpOffset", fixes);
        var electricityStrength = ClampNumber(config.ElectricityStrength, 0, 0.3, Prompts.DefaultConfig.ElectricityStrength, "electricityStrength", fixes);
        var electricityFreq = ClampInteger(config.ElectricityFreq, 1, 20, Prompts.DefaultConfig.ElectricityFreq, "electricityFreq", fixes);

        if (knotRadius > 0.9 && tubeRadius > 0.15)
        {
            tubeRadius = 0.15;
            fixes.Add("Reduced tubeRadius to 0.15 because knotRadius exceeds 0.9.");
        }

        if (waveAmplitude > 0.5 && tubeRadius >= 0.2)
        {
            tubeRadius = 0.19;
            fixes.Add("Reduced tubeRadius below 0.2 because waveAmplitude exceeds 0.5.");
        }

        if (lumps > 30 && lumpHeight >= 1)
        {
            lumpHeight = 0.99;
            fixes.Add("Reduced lumpHeight below 1 because lumps exceeds 30.");
        }

        var bgColor = RepairColor(config.BgColor, ColorKind.Rgb, Prompts.DefaultConfig.BgColor, "bgColor", fixes);
        var fillColor = RepairColor(config.FillColor, ColorKind.Rgba, Prompts.DefaultConfig.FillColor, "fillColor", fixes);
        var wireColor = RepairColor(config.WireColor, ColorKind.Rgb, Prompts.DefaultConfig.WireColor, "wireColor", fixes);

        var repaired = config with
        {
            P = p,
            Q = q,
            RingDetail = ringDetail,
            PathDetail = pathDetail,
            TubeRadius = tubeRadius,
            KnotRadius = knotRadius,
            WaveAmplitude = waveAmplitude,
            Eccentricity = eccentricity,
            TwistTurns = twistTurns,
            GlobalTwistTurns = globalTwistTurns,
            TwistDirection = twistDirection,
            Lumps = lumps,
            LumpHeight = lumpHeight,
            LumpOffset = lumpOffset,
            ElectricityStrength = electricityStrength,
            ElectricityFreq = electricityFreq,
            BgColor = bgColor,
            FillColor = fillColor,
            WireColor = wireColor
        };

        return (repaired, fixes);
    }

    private static int ClampInteger(int value, int min, int max, int fallback, string field, ICollection<string> fixes)
    {
        var repaired = Math.Clamp(value == 0 && min > 0 ? fallback : value, min, max);
        return repaired == value
            ? repaired
            : RepairValue(field, repaired, fixes);
    }

    private static double ClampNumber(double value, double min, double max, double fallback, string field, ICollection<string> fixes)
    {
        var source = double.IsFinite(value) ? value : fallback;
        var repaired = Math.Clamp(source, min, max);
        return double.IsFinite(value) && repaired.Equals(value)
            ? repaired
            : RepairValue(field, repaired, fixes);
    }

    private static T RepairValue<T>(string field, T value, ICollection<string> fixes)
    {
        fixes.Add($"Repaired {field} to {value}.");
        return value;
    }

    private static int GreatestCommonDivisor(int a, int b)
    {
        while (b != 0) (a, b) = (b, a % b);
        return a;
    }

    private static string RepairColor(string? color, ColorKind kind, string fallback, string field, ICollection<string> fixes)
    {
        var match = ColorPattern.Match(color ?? string.Empty);
        if (!match.Success)
        {
            fixes.Add($"Replaced invalid {field} with a valid default color.");
            return fallback;
        }

        var red = ParseChannel(match.Groups["r"].Value);
        var green = ParseChannel(match.Groups["g"].Value);
        var blue = ParseChannel(match.Groups["b"].Value);
        var hasAlpha = match.Groups["a"].Success;
        var alpha = hasAlpha ? ParseAlpha(match.Groups["a"].Value) : 1d;

        if (kind == ColorKind.Rgba && !hasAlpha)
        {
            alpha = 0.9;
        }

        var repaired = kind == ColorKind.Rgb
            ? $"rgb({red}, {green}, {blue})"
            : $"rgba({red}, {green}, {blue}, {alpha.ToString("0.##", CultureInfo.InvariantCulture)})";

        if (!string.Equals(color, repaired, StringComparison.Ordinal))
        {
            fixes.Add($"Normalized {field} to valid {kind.ToString().ToLowerInvariant()} color syntax.");
        }

        return repaired;
    }

    private static int ParseChannel(string text)
    {
        var channel = double.Parse(text, CultureInfo.InvariantCulture);
        return (int)Math.Round(Math.Clamp(channel, 0, 255), MidpointRounding.AwayFromZero);
    }

    private static double ParseAlpha(string text)
    {
        var alpha = double.Parse(text, CultureInfo.InvariantCulture);
        if (alpha > 1 && alpha <= 100)
        {
            alpha /= 100;
        }

        return Math.Clamp(alpha, 0, 1);
    }

    private enum ColorKind
    {
        Rgb,
        Rgba
    }
}
