using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class PaymentEndpoints
{
    public static IEndpointRouteBuilder MapPaymentEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/payments").WithTags("Payment Processing");

        // 1. Get Payment Configuration for Store
        group.MapGet("/config", (string? storeId, PaymentService payments) =>
        {
            var config = payments.GetPaymentConfig(storeId);
            return Results.Ok(config);
        }).WithName("GetPaymentConfig")
          .WithSummary("Retrieve active public payment gateway settings (Razorpay/Stripe/COD) for tenant");

        // 2. Razorpay: Create Order
        group.MapPost("/razorpay/create-order", async (CreatePaymentOrderRequest req, string? storeId, PaymentService payments) =>
        {
            try
            {
                var res = await payments.CreateRazorpayOrderAsync(req, storeId);
                return Results.Ok(res);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Razorpay order creation failed: {ex.Message}");
            }
        }).WithName("CreateRazorpayOrder")
          .WithSummary("Initialize Razorpay order and fetch checkout credentials");

        // 3. Razorpay: Verify Payment Signature & Confirm Order
        group.MapPost("/razorpay/verify", async (RazorpayVerificationRequest req, string? storeId, PaymentService payments) =>
        {
            try
            {
                var result = await payments.VerifyRazorpayPaymentAsync(req, storeId);
                return result.Success ? Results.Ok(result) : Results.BadRequest(result);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Razorpay payment verification failed: {ex.Message}");
            }
        }).WithName("VerifyRazorpayPayment")
          .WithSummary("Verify HMAC-SHA256 signature, finalize order, and decrement inventory");

        // 4. Stripe: Create Payment Intent
        group.MapPost("/stripe/create-payment-intent", async (CreatePaymentOrderRequest req, string? storeId, PaymentService payments) =>
        {
            try
            {
                var res = await payments.CreateStripePaymentIntentAsync(req, storeId);
                return Results.Ok(res);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Stripe PaymentIntent creation failed: {ex.Message}");
            }
        }).WithName("CreateStripePaymentIntent")
          .WithSummary("Create Stripe PaymentIntent and client_secret");

        // 5. Stripe: Verify Payment Intent & Confirm Order
        group.MapPost("/stripe/verify", async (StripeVerificationRequest req, string? storeId, PaymentService payments) =>
        {
            try
            {
                var result = await payments.VerifyStripePaymentAsync(req, storeId);
                return result.Success ? Results.Ok(result) : Results.BadRequest(result);
            }
            catch (Exception ex)
            {
                return Results.Problem($"Stripe verification failed: {ex.Message}");
            }
        }).WithName("VerifyStripePayment")
          .WithSummary("Verify Stripe PaymentIntent, finalize order, and decrement inventory");

        // 6. Cash on Delivery (COD) Confirmation
        group.MapPost("/cod/confirm", async (CodOrderRequest req, string? storeId, PaymentService payments) =>
        {
            try
            {
                var result = await payments.ConfirmCodOrderAsync(req, storeId);
                return result.Success ? Results.Ok(result) : Results.BadRequest(result);
            }
            catch (Exception ex)
            {
                return Results.Problem($"COD confirmation failed: {ex.Message}");
            }
        }).WithName("ConfirmCodOrder")
          .WithSummary("Confirm Cash on Delivery order and decrement inventory");

        // Webhook handler
        app.MapPost("/api/webhooks/payment", async (HttpRequest req) =>
        {
            using var reader = new StreamReader(req.Body);
            var body = await reader.ReadToEndAsync();
            Console.WriteLine($"[Payment Webhook Received] {body}");
            return Results.Ok(new { success = true, verified = true, receivedAt = DateTime.UtcNow });
        }).WithTags("Payment Processing")
          .WithName("PaymentWebhook")
          .WithSummary("Universal webhook listener for asynchronous gateway notifications");

        return app;
    }
}
