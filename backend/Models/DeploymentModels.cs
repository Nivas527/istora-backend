using System.Text.Json.Serialization;

namespace ShopifyEngine.Api.Models;

public class Deployment
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("name")]
    public string Name { get; set; } = string.Empty;

    [JsonPropertyName("project")]
    public string Project { get; set; } = string.Empty;

    [JsonPropertyName("subdomain")]
    public string Subdomain { get; set; } = string.Empty;

    [JsonPropertyName("liveUrl")]
    public string LiveUrl { get; set; } = string.Empty;

    [JsonPropertyName("status")]
    public string Status { get; set; } = "READY"; // 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR'

    [JsonPropertyName("environment")]
    public string Environment { get; set; } = "production";

    [JsonPropertyName("isDistZip")]
    public bool IsDistZip { get; set; }

    [JsonPropertyName("commit")]
    public DeploymentCommit? Commit { get; set; }

    [JsonPropertyName("framework")]
    public string Framework { get; set; } = "React 19";

    [JsonPropertyName("nodeVersion")]
    public string NodeVersion { get; set; } = "20.x";

    [JsonPropertyName("region")]
    public string Region { get; set; } = "iad1 (Washington, D.C.)";

    [JsonPropertyName("createdAt")]
    public string CreatedAt { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonPropertyName("buildDurationMs")]
    public int BuildDurationMs { get; set; } = 840;

    [JsonPropertyName("bundleSizeKb")]
    public double BundleSizeKb { get; set; } = 0;

    [JsonPropertyName("envVars")]
    public Dictionary<string, string> EnvVars { get; set; } = new();

    [JsonPropertyName("files")]
    public Dictionary<string, string> Files { get; set; } = new();

    [JsonPropertyName("logs")]
    public List<DeploymentLog> Logs { get; set; } = new();
}

public class DeploymentCommit
{
    [JsonPropertyName("hash")]
    public string Hash { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;

    [JsonPropertyName("author")]
    public string Author { get; set; } = "developer";

    [JsonPropertyName("branch")]
    public string Branch { get; set; } = "main";
}

public class DeploymentLog
{
    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = string.Empty;

    [JsonPropertyName("level")]
    public string Level { get; set; } = "info"; // 'info' | 'warn' | 'error' | 'success'

    [JsonPropertyName("message")]
    public string Message { get; set; } = string.Empty;
}

public class SaveDeploymentRequest
{
    [JsonPropertyName("deployment")]
    public Deployment? Deployment { get; set; }
}

public class SyncDeploymentsRequest
{
    [JsonPropertyName("deployments")]
    public List<Deployment>? Deployments { get; set; }
}

public class CompileRequest
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("loader")]
    public string Loader { get; set; } = "jsx";
}

public class CompileResponse
{
    [JsonPropertyName("code")]
    public string Code { get; set; } = string.Empty;

    [JsonPropertyName("durationMs")]
    public long DurationMs { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }
}
