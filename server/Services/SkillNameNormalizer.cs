using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace server.Services;

public static class SkillNameNormalizer
{
    private static readonly Dictionary<string, string> Aliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["js"] = "JavaScript", ["javascript"] = "JavaScript",
        ["ts"] = "TypeScript", ["typescript"] = "TypeScript",
        ["node"] = "Node.js", ["nodejs"] = "Node.js", ["node-js"] = "Node.js",
        ["reactjs"] = "React", ["react-js"] = "React",
        ["nextjs"] = "Next.js", ["next-js"] = "Next.js",
        ["vuejs"] = "Vue.js", ["vue-js"] = "Vue.js",
        ["csharp"] = "C#", ["c-sharp"] = "C#",
        ["cpp"] = "C++", ["c-plus-plus"] = "C++",
        ["dotnet"] = ".NET", ["aspnet"] = "ASP.NET", ["aspdotnet"] = "ASP.NET",
        ["aspnetcore"] = "ASP.NET Core", ["aspdotnetcore"] = "ASP.NET Core",
        ["html"] = "HTML", ["css"] = "CSS", ["sql"] = "SQL", ["api"] = "API",
        ["ios"] = "iOS", ["macos"] = "macOS", ["aws"] = "AWS", ["gcp"] = "GCP",
        ["graphql"] = "GraphQL", ["mongodb"] = "MongoDB", ["postgres"] = "PostgreSQL",
        ["postgresql"] = "PostgreSQL", ["mysql"] = "MySQL", ["kubernetes"] = "Kubernetes",
        ["github"] = "GitHub", ["gitlab"] = "GitLab", ["devops"] = "DevOps"
    };

    public static string CanonicalizeName(string value)
    {
        var trimmed = Regex.Replace(value.Trim(), @"\s+", " ");
        var key = ToSlug(trimmed);
        if (Aliases.TryGetValue(key, out var canonical))
        {
            return canonical;
        }

        return CultureInfo.InvariantCulture.TextInfo.ToTitleCase(trimmed.ToLowerInvariant());
    }

    public static string CanonicalizeCategory(string value)
    {
        var trimmed = Regex.Replace(value.Trim(), @"\s+", " ");
        var key = ToSlug(trimmed);
        return key switch
        {
            "frontend" or "front-end" => "Frontend",
            "backend" or "back-end" => "Backend",
            "devops" => "DevOps",
            "ui-ux" or "ux-ui" => "UI/UX",
            _ => CultureInfo.InvariantCulture.TextInfo.ToTitleCase(trimmed.ToLowerInvariant())
        };
    }

    public static string ToSlug(string value)
    {
        var normalized = Regex.Replace(value.Trim().ToLowerInvariant(), @"c\s*#", "c-sharp");
        normalized = Regex.Replace(normalized, @"c\s*\+\s*\+", "c-plus-plus");
        normalized = normalized
            .Replace(".net", "dotnet", StringComparison.Ordinal)
            .Replace("node.js", "nodejs", StringComparison.Ordinal)
            .Replace("next.js", "nextjs", StringComparison.Ordinal)
            .Replace("vue.js", "vuejs", StringComparison.Ordinal)
            .Normalize(NormalizationForm.FormD);
        var builder = new StringBuilder(normalized.Length);
        var separatorPending = false;
        foreach (var character in normalized)
        {
            if (CharUnicodeInfo.GetUnicodeCategory(character) == UnicodeCategory.NonSpacingMark)
            {
                continue;
            }

            if (char.IsLetterOrDigit(character))
            {
                if (separatorPending && builder.Length > 0)
                {
                    builder.Append('-');
                }
                builder.Append(character);
                separatorPending = false;
            }
            else
            {
                separatorPending = true;
            }
        }

        return builder.ToString();
    }
}
