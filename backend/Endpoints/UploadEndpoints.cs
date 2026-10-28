using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public record BannerVideoRequest(string? VideoUrl);

public static class UploadEndpoints
{
    private const long MaxBannerVideoBytes = 50 * 1024 * 1024; // 50 MB
    private const long MaxPreviewVideoBytes = 25 * 1024 * 1024; // 25 MB
    private const long MaxImageBytes = 10 * 1024 * 1024; // 10 MB

    public static IEndpointRouteBuilder MapUploadEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api").WithTags("Media & Storage");

        // 1. Image Upload (Supports Cloudflare R2 or local disk fallback)
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

                if (file.Length > MaxImageBytes)
                {
                    return Results.BadRequest(new { error = $"Image exceeds maximum allowed limit of {MaxImageBytes / (1024 * 1024)}MB." });
                }

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                var allowed = new[] { ".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif", ".avif" };
                if (!allowed.Contains(ext))
                {
                    return Results.BadRequest(new { error = "Supported image formats: JPG, PNG, WEBP, SVG, GIF, AVIF" });
                }

                var safeFileName = $"upload_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Random.Shared.Next(1000, 9999)}{ext}";
                using var stream = file.OpenReadStream();
                var url = await r2Storage.UploadFileAsync(stream, safeFileName, file.ContentType ?? "image/jpeg");

                return Results.Ok(new
                {
                    url,
                    fileName = safeFileName,
                    size = file.Length,
                    sizeFormatted = $"{file.Length / 1024.0 / 1024.0:F2} MB",
                    isR2 = r2Storage.IsR2Configured()
                });
            }
            catch (Exception ex)
            {
                return Results.Problem($"Image upload failed: {ex.Message}");
            }
        }).WithName("UploadImage")
          .WithSummary("Upload product media to Cloudflare R2 or local storage");

        // 2. Video Upload (Banner Videos & Preview Videos with strict size & quota limits)
        group.MapPost("/upload/video", async (HttpRequest request, R2StorageService r2Storage) =>
        {
            try
            {
                if (!request.HasFormContentType)
                {
                    return Results.BadRequest(new { error = "Multipart form-data expected with 'file' and optional 'type' ('banner' | 'preview')" });
                }

                var form = await request.ReadFormAsync();
                var file = form.Files.FirstOrDefault();
                if (file == null || file.Length == 0)
                {
                    return Results.BadRequest(new { error = "No video file uploaded" });
                }

                var rawType = form["type"].ToString().Trim().ToLowerInvariant();
                var videoType = rawType == "preview" ? "preview" : "banner";

                var maxBytes = videoType == "banner" ? MaxBannerVideoBytes : MaxPreviewVideoBytes;
                var maxMb = maxBytes / (1024 * 1024);

                if (file.Length > maxBytes)
                {
                    return Results.BadRequest(new
                    {
                        error = $"Video file size ({file.Length / 1024.0 / 1024.0:F1}MB) exceeds the maximum allowed limit of {maxMb}MB for {videoType} videos."
                    });
                }

                var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
                var allowedExtensions = new[] { ".mp4", ".webm", ".mov", ".m4v" };
                if (!allowedExtensions.Contains(ext))
                {
                    return Results.BadRequest(new { error = "Supported video formats: MP4, WebM, MOV, M4V" });
                }

                var mimeType = ext switch
                {
                    ".mp4" or ".m4v" => "video/mp4",
                    ".webm" => "video/webm",
                    ".mov" => "video/quicktime",
                    _ => "video/mp4"
                };

                var safeFileName = $"video_{videoType}_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}_{Random.Shared.Next(1000, 9999)}{ext}";
                using var stream = file.OpenReadStream();
                var url = await r2Storage.UploadFileAsync(stream, safeFileName, mimeType);

                return Results.Ok(new
                {
                    url,
                    fileName = safeFileName,
                    size = file.Length,
                    sizeFormatted = $"{file.Length / 1024.0 / 1024.0:F1} MB",
                    type = videoType,
                    contentType = mimeType,
                    isR2 = r2Storage.IsR2Configured()
                });
            }
            catch (Exception ex)
            {
                return Results.Problem($"Video upload failed: {ex.Message}");
            }
        }).WithName("UploadVideo")
          .WithSummary("Upload high-performance banner videos (max 50MB) or preview clips (max 25MB)");

        // 3. Store Banner Video Management
        group.MapPost("/stores/{storeId}/banner-video", (string storeId, BannerVideoRequest req, StoreService storeService) =>
        {
            var success = storeService.SetBannerVideo(storeId, req.VideoUrl);
            return success ? Results.Ok(new { success = true, bannerVideoUrl = req.VideoUrl }) : Results.NotFound(new { error = "Store not found" });
        }).WithName("SetBannerVideo")
          .WithSummary("Attach or update store hero banner video");

        group.MapDelete("/stores/{storeId}/banner-video", (string storeId, StoreService storeService) =>
        {
            var success = storeService.SetBannerVideo(storeId, null);
            return success ? Results.Ok(new { success = true, message = "Banner video removed" }) : Results.NotFound(new { error = "Store not found" });
        }).WithName("RemoveBannerVideo")
          .WithSummary("Remove store hero banner video");

        // 4. Store Preview Videos CRUD (Enforces maximum quota of 5 preview videos)
        group.MapGet("/stores/{storeId}/preview-videos", (string storeId, StoreService storeService) =>
        {
            var videos = storeService.GetPreviewVideos(storeId);
            return Results.Ok(new
            {
                count = videos.Count,
                maxLimit = StoreService.MaxPreviewVideosPerStore,
                remainingSlots = Math.Max(0, StoreService.MaxPreviewVideosPerStore - videos.Count),
                videos
            });
        }).WithName("GetStorePreviewVideos")
          .WithSummary("Get preview videos showcase for store with quota count");

        group.MapPost("/stores/{storeId}/preview-videos", (string storeId, PreviewVideoItem item, StoreService storeService) =>
        {
            var result = storeService.AddPreviewVideo(storeId, item);
            if (!result.success)
            {
                return Results.BadRequest(new { error = result.message });
            }

            var all = storeService.GetPreviewVideos(storeId);
            return Results.Ok(new
            {
                message = result.message,
                added = result.item,
                count = all.Count,
                maxLimit = StoreService.MaxPreviewVideosPerStore,
                remainingSlots = Math.Max(0, StoreService.MaxPreviewVideosPerStore - all.Count),
                videos = all
            });
        }).WithName("AddStorePreviewVideo")
          .WithSummary("Add a product/store preview video (max 5 per store enforced)");

        group.MapDelete("/stores/{storeId}/preview-videos/{videoId}", (string storeId, string videoId, StoreService storeService) =>
        {
            var deleted = storeService.DeletePreviewVideo(storeId, videoId);
            if (!deleted)
            {
                return Results.NotFound(new { error = "Preview video not found or already deleted" });
            }

            var all = storeService.GetPreviewVideos(storeId);
            return Results.Ok(new
            {
                message = "Preview video deleted successfully",
                count = all.Count,
                maxLimit = StoreService.MaxPreviewVideosPerStore,
                remainingSlots = Math.Max(0, StoreService.MaxPreviewVideosPerStore - all.Count),
                videos = all
            });
        }).WithName("DeleteStorePreviewVideo")
          .WithSummary("Delete a store preview video and free up a quota slot");

        // 5. Serve Uploaded Media from Disk with HTTP Range Processing (Essential for video playback & seeking)
        var uploadsDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        if (!Directory.Exists(uploadsDir)) Directory.CreateDirectory(uploadsDir);

        app.MapGet("/uploads/{fileName}", (string fileName) =>
        {
            var filePath = Path.Combine(uploadsDir, Path.GetFileName(fileName));
            if (!File.Exists(filePath)) return Results.NotFound();

            var ext = Path.GetExtension(fileName).TrimStart('.').ToLowerInvariant();
            var mime = ext switch
            {
                "mp4" or "m4v" => "video/mp4",
                "webm" => "video/webm",
                "mov" => "video/quicktime",
                "jpg" or "jpeg" => "image/jpeg",
                "png" => "image/png",
                "webp" => "image/webp",
                "gif" => "image/gif",
                "svg" => "image/svg+xml",
                "avif" => "image/avif",
                _ => "application/octet-stream"
            };

            // enableRangeProcessing enables HTTP 206 Partial Content for video seek / streaming
            return Results.File(filePath, mime, enableRangeProcessing: true);
        }).WithTags("Media & Storage")
          .WithName("ServeUpload")
          .WithSummary("Serve static media with HTTP byte-range video streaming support");

        return app;
    }
}
