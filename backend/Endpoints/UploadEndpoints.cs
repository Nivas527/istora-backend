using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class UploadEndpoints
{
    public static IEndpointRouteBuilder MapUploadEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("Media & Storage");

        // Upload image files (supports Cloudflare R2 or local disk fallback)
        group.MapPost("/upload", async (HttpRequest request, R2StorageService r2Storage) =>
        {
            try
            {
                if (!request.HasFormContentType)
                {
                    return Results.BadRequest(new { error = "Multipart form-data expected" });
                }

                var form = await request.ReadFormAsync();
                var file = form.Files.FirstOrDefault();
                if (file == null || file.Length == 0)
                {
                    return Results.BadRequest(new { error = "No image file uploaded" });
                }

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".avif" };
                if (!allowed.Contains(ext))
                {
                    return Results.BadRequest(new { error = "Supported formats: JPG, PNG, WEBP, SVG, GIF, AVIF" });
                }

                var safeFileName = $"upload_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Random.Shared.Next(1000, 9999)}{ext}";
                using var stream = file.OpenReadStream();
                var url = await r2Storage.UploadFileAsync(stream, safeFileName, file.ContentType ?? "image/jpeg");

                return Results.Ok(new { url, fileName = safeFileName, size = file.Length, isR2 = r2Storage.IsR2Configured() });
            }
            catch (Exception ex)
            {
                return Results.Problem($"Image upload failed: {ex.Message}");
            }
        }).WithName("UploadImage")
          .WithSummary("Upload product media to Cloudflare R2 or local storage");

        // Serve uploaded images directly from local disk
        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

        app.MapGet("/uploads/{fileName}", (string fileName) =>
        {
            var filePath = Path.Combine(uploadsDir, Path.GetFileName(fileName));
            if (!File.Exists(filePath)) return Results.NotFound();

            var ext = Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();
            var mime = ext switch
            {
                "jpg" or "jpeg" => "image/jpeg",
                "png" => "image/png",
                "webp" => "image/webp",
                "gif" => "image/gif",
                "svg" => "image/svg+xml",
                "avif" => "image/avif",
                _ => "application/octet-stream"
            };

            return Results.File(filePath, mime);
        }).WithTags("Media & Storage")
          .WithName("ServeUpload")
          .WithSummary("Serve static uploaded image");

        return app;
    }
}
