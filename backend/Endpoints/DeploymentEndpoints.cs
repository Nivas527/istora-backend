using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class DeploymentEndpoints
{
    public static IEndpointRouteBuilder MapDeploymentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/deployments").WithTags("Edge React & dist.zip Hosting");

        group.MapGet("/", (DeploymentService depService) =>
            Results.Ok(new { deployments = depService.GetAll() }))
            .WithName("GetAllDeployments")
            .WithSummary("List all hosted React frontend builds and versions");

        group.MapGet("/{id}", (string id, DeploymentService depService) =>
        {
            var dep = depService.GetById(id);
            return dep != null ? Results.Ok(dep) : Results.NotFound();
        }).WithName("GetDeploymentById")
          .WithSummary("Get deployment metadata and file tree");

        group.MapPost("/save", (SaveDeploymentRequest req, DeploymentService depService) =>
        {
            if (req.Deployment != null)
            {
                depService.Upsert(req.Deployment);
                return Results.Ok(new { success = true, id = req.Deployment.Id });
            }
            return Results.BadRequest(new { error = "Deployment object required" });
        }).WithName("SaveDeployment")
          .WithSummary("Persist deployment bundle");

        group.MapPost("/sync", (SyncDeploymentsRequest req, DeploymentService depService) =>
        {
            if (req.Deployments != null)
            {
                depService.Sync(req.Deployments);
                return Results.Ok(new { success = true, count = req.Deployments.Count });
            }
            return Results.BadRequest(new { error = "Deployments array required" });
        }).WithName("SyncDeployments")
          .WithSummary("Sync batch deployments");

        group.MapDelete("/{id}", (string id, DeploymentService depService) =>
        {
            var deleted = depService.Delete(id);
            return Results.Ok(new { success = deleted });
        }).WithName("DeleteDeployment")
          .WithSummary("Purge deployment bundle");

        group.MapPost("/compile", async (CompileRequest req, JsxCompilerService compiler) =>
        {
            if (string.IsNullOrWhiteSpace(req.Code))
                return Results.BadRequest(new { error = "Code is required" });

            var res = await compiler.CompileAsync(req.Code, req.Loader ?? "jsx");
            return Results.Ok(res);
        }).WithName("CompileJsx")
          .WithSummary("In-memory JSX/TSX compilation service");

        // Upload and unpack dist.zip directly on the server
        group.MapPost("/upload-zip", async (HttpRequest request, DeploymentService depService) =>
        {
            try
            {
                Stream zipStream;
                string appName = "dist-app";
                string env = "production";

                if (request.HasFormContentType)
                {
                    var form = await request.ReadFormAsync();
                    var file = form.Files.FirstOrDefault();
                    if (file == null) return Results.BadRequest(new { error = "No file attached in form-data" });

                    appName = form["appName"].FirstOrDefault() ?? Path.GetFileNameWithoutExtension(file.FileName);
                    env = form["environment"].FirstOrDefault() ?? "production";
                    zipStream = file.OpenReadStream();
                }
                else
                {
                    zipStream = request.Body;
                }

                var newDeployment = await depService.ExtractZipToDeploymentAsync(zipStream, appName, env);
                return Results.Created($"/hosted/{newDeployment.Id}", newDeployment);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Failed to extract zip: {ex.Message}");
            }
        }).WithName("UploadZipDeployment")
          .WithSummary("Direct dist.zip archive deployment and auto-unpacking");

        // Dynamic Hosted App & Edge Runner Route
        app.MapGet("/hosted/{id}/{*assetPath}", async (string id, string? assetPath, HttpContext context, DeploymentService depService) =>
        {
            var deployment = depService.GetById(id);
            if (deployment == null)
            {
                context.Response.StatusCode = 404;
                context.Response.ContentType = "text/html; charset=utf-8";
                await context.Response.WriteAsync($"<div style='background:#09090b;color:#fff;padding:3rem;font-family:sans-serif;'><h2>Deployment '{id}' not found</h2></div>");
                return;
            }

            // Sub-Asset Request (e.g. assets/index-xxx.js or images)
            if (!string.IsNullOrWhiteSpace(assetPath))
            {
                var assetResult = depService.ResolveAsset(deployment, assetPath);
                if (assetResult != null)
                {
                    var (content, contentType) = assetResult.Value;
                    context.Response.ContentType = contentType;

                    if (content.StartsWith("data:") && content.Contains(";base64,"))
                    {
                        var base64Data = content[(content.IndexOf(";base64,") + 8)..];
                        var bytes = Convert.FromBase64String(base64Data);
                        await context.Response.Body.WriteAsync(bytes);
                        return;
                    }

                    await context.Response.WriteAsync(content);
                    return;
                }
            }

            // Root Request or SPA Fallback
            var html = depService.PrepareHtml(deployment);
            context.Response.ContentType = "text/html; charset=utf-8";
            await context.Response.WriteAsync(html);
        }).WithTags("Edge React & dist.zip Hosting")
          .WithName("ServeHostedDeployment")
          .WithSummary("Serve compiled SPA with asset resolution and HTML injection");

        return app;
    }
}
