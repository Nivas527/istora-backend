using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;

namespace ShopifyEngine.Api.Services;

public class R2StorageService
{
    private readonly IConfiguration _config;
    private readonly ILogger<R2StorageService> _logger;
    private readonly string _uploadsLocalDir;

    public R2StorageService(IConfiguration config, ILogger<R2StorageService> logger)
    {
        _config = config;
        _logger = logger;
        _uploadsLocalDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads");
        if (!Directory.Exists(_uploadsLocalDir)) Directory.CreateDirectory(_uploadsLocalDir);
    }

    public bool IsR2Configured()
    {
        var accountId = _config["R2_ACCOUNT_ID"] ?? _config["R2:AccountId"];
        var accessKey = _config["R2_ACCESS_KEY_ID"] ?? _config["R2:AccessKeyId"];
        var secretKey = _config["R2_SECRET_ACCESS_KEY"] ?? _config["R2:SecretAccessKey"];
        return !string.IsNullOrWhiteSpace(accountId) &&
               !string.IsNullOrWhiteSpace(accessKey) &&
               !string.IsNullOrWhiteSpace(secretKey);
    }

    public async Task<string> UploadFileAsync(Stream fileStream, string fileName, string contentType)
    {
        var accountId = _config["R2_ACCOUNT_ID"] ?? _config["R2:AccountId"];
        var accessKey = _config["R2_ACCESS_KEY_ID"] ?? _config["R2:AccessKeyId"];
        var secretKey = _config["R2_SECRET_ACCESS_KEY"] ?? _config["R2:SecretAccessKey"];
        var bucketName = _config["R2_BUCKET_NAME"] ?? _config["R2:BucketName"] ?? "apexcommerce";
        var publicUrl = _config["R2_PUBLIC_URL"] ?? _config["R2:PublicUrl"] ?? "https://media.istora.online";

        // If R2 credentials are fully set, upload to Cloudflare R2
        if (IsR2Configured())
        {
            try
            {
                var credentials = new BasicAWSCredentials(accessKey, secretKey);
                var s3Config = new AmazonS3Config
                {
                    ServiceURL = $"https://{accountId}.r2.cloudflarestorage.com",
                    ForcePathStyle = true
                };

                using var s3Client = new AmazonS3Client(credentials, s3Config);
                var putRequest = new PutObjectRequest
                {
                    BucketName = bucketName,
                    Key = fileName,
                    InputStream = fileStream,
                    ContentType = contentType,
                    DisablePayloadSigning = true
                };

                await s3Client.PutObjectAsync(putRequest);
                _logger.LogInformation("[R2 Storage] Uploaded {FileName} to bucket {Bucket}", fileName, bucketName);

                var normalizedBase = publicUrl.TrimEnd('/');
                return $"{normalizedBase}/{fileName}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[R2 Storage] Upload failed. Falling back to local disk storage for {FileName}", fileName);
            }
        }

        // Fallback: Local disk storage
        var localPath = Path.Combine(_uploadsLocalDir, fileName);
        if (fileStream.CanSeek) fileStream.Position = 0;
        using (var dest = new FileStream(localPath, FileMode.Create))
        {
            await fileStream.CopyToAsync(dest);
        }

        return $"/uploads/{fileName}";
    }
}
