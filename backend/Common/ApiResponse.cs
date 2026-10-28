namespace ShopifyEngine.Api.Common;

/// <summary>
/// Standardized enterprise envelope for API responses
/// </summary>
public class ApiResponse<T>
{
    public bool Success { get; set; } = true;
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? TraceId { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null, string? traceId = null) =>
        new() { Success = true, Data = data, Message = message, TraceId = traceId };

    public static ApiResponse<T> Fail(string error, string? traceId = null) =>
        new() { Success = false, Errors = new List<string> { error }, TraceId = traceId };

    public static ApiResponse<T> Fail(List<string> errors, string? traceId = null) =>
        new() { Success = false, Errors = errors, TraceId = traceId };
}
