using System.Diagnostics;
using ShopifyEngine.Api.Models;

namespace ShopifyEngine.Api.Services;

public class JsxCompilerService
{
    private readonly IWebHostEnvironment _env;

    public JsxCompilerService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<CompileResponse> CompileAsync(string code, string loader = "jsx")
    {
        var sw = Stopwatch.StartNew();

        // 1. Try local node_modules esbuild binary or npx esbuild
        var projectRoot = Directory.GetParent(_env.ContentRootPath)?.FullName ?? _env.ContentRootPath;
        var esbuildLocal = Path.Combine(projectRoot, "node_modules", ".bin", "esbuild");

        var binaryPath = File.Exists(esbuildLocal) ? esbuildLocal : "esbuild";

        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = binaryPath,
                Arguments = $"--loader={loader} --target=es2020 --jsx=transform",
                RedirectStandardInput = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using var process = Process.Start(psi);
            if (process != null)
            {
                await process.StandardInput.WriteAsync(code);
                process.StandardInput.Close();

                var output = await process.StandardOutput.ReadToEndAsync();
                var error = await process.StandardError.ReadToEndAsync();
                await process.WaitForExitAsync();

                sw.Stop();

                if (process.ExitCode == 0 && !string.IsNullOrWhiteSpace(output))
                {
                    return new CompileResponse
                    {
                        Code = output,
                        DurationMs = sw.ElapsedMilliseconds
                    };
                }

                if (!string.IsNullOrWhiteSpace(error))
                {
                    return new CompileResponse
                    {
                        Code = code,
                        DurationMs = sw.ElapsedMilliseconds,
                        Error = error
                    };
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[C# esbuild bridge] Fallback notice: {ex.Message}");
        }

        sw.Stop();
        // Fallback: return raw code for in-browser Babel
        return new CompileResponse
        {
            Code = code,
            DurationMs = sw.ElapsedMilliseconds
        };
    }
}
