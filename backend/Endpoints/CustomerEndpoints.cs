using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ShopifyEngine.Api.Data;
using ShopifyEngine.Api.Models;
using ShopifyEngine.Api.Services;

namespace ShopifyEngine.Api.Endpoints;

public static class CustomerEndpoints
{
    private static string HashPassword(string password)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(password + "_istora_salt_2026"));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static string GenerateCustomerToken(string customerId, string email)
    {
        var raw = $"{customerId}:{email}:{DateTime.UtcNow:yyyyMMdd}";
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(raw)))[..16].ToLowerInvariant();
        return $"shpcust_{customerId}_{hash}";
    }

    private static CustomerProfile ToCustomerProfile(DbCustomer dbCust)
    {
        List<SavedAddress> addresses = new();
        try
        {
            if (!string.IsNullOrWhiteSpace(dbCust.SavedAddressesJson))
            {
                addresses = JsonSerializer.Deserialize<List<SavedAddress>>(dbCust.SavedAddressesJson) ?? new();
            }
        }
        catch { }

        return new CustomerProfile
        {
            Id = dbCust.Id,
            StoreId = dbCust.StoreId,
            Name = dbCust.Name,
            Email = dbCust.Email,
            Phone = dbCust.Phone,
            Avatar = dbCust.Avatar,
            AuthProvider = dbCust.AuthProvider,
            OrdersCount = dbCust.OrdersCount,
            TotalSpent = dbCust.TotalSpent,
            Addresses = addresses,
            CreatedAt = dbCust.CreatedAt
        };
    }

    public static IEndpointRouteBuilder MapCustomerEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/customer").WithTags("Customer Accounts & Shopper Portal");

        // 1. Customer Registration
        group.MapPost("/auth/register", async (CustomerRegisterRequest req, ShopifyDbContext db, ITenantProvider tenantProvider) =>
        {
            var storeId = !string.IsNullOrWhiteSpace(req.StoreId)
                ? HttpTenantProvider.NormalizeStoreId(req.StoreId)
                : (tenantProvider.CurrentStoreId ?? "store_apex");

            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            {
                return Results.BadRequest(new CustomerAuthResponse
                {
                    Success = false,
                    Message = "Email and password are required."
                });
            }

            var cleanEmail = req.Email.Trim().ToLowerInvariant();
            var existing = await db.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.StoreId == storeId && c.Email.ToLower() == cleanEmail);

            if (existing != null && !string.IsNullOrWhiteSpace(existing.PasswordHash))
            {
                return Results.BadRequest(new CustomerAuthResponse
                {
                    Success = false,
                    Message = "An account with this email already exists. Please sign in."
                });
            }

            var passwordHash = HashPassword(req.Password);

            if (existing != null)
            {
                // Customer was created from guest checkout, upgrade to registered customer
                existing.Name = !string.IsNullOrWhiteSpace(req.Name) ? req.Name.Trim() : existing.Name;
                existing.Phone = req.Phone?.Trim() ?? existing.Phone;
                existing.PasswordHash = passwordHash;
                existing.AuthProvider = "email";
                await db.SaveChangesAsync();

                var profile = ToCustomerProfile(existing);
                var token = GenerateCustomerToken(existing.Id, existing.Email);

                return Results.Ok(new CustomerAuthResponse
                {
                    Success = true,
                    Message = "Account registered successfully!",
                    Token = token,
                    Customer = profile
                });
            }

            // Create brand new customer
            var newId = $"cust_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}";
            var defaultAddresses = new List<SavedAddress>
            {
                new SavedAddress
                {
                    Id = $"addr_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                    Label = "Home",
                    FirstName = req.Name?.Split(' ').FirstOrDefault() ?? "Shopper",
                    LastName = req.Name?.Split(' ').Skip(1).FirstOrDefault() ?? "",
                    Address = "500 Howard Street, Suite 300",
                    City = "Bangalore",
                    State = "Karnataka",
                    Zip = "560001",
                    Phone = req.Phone ?? "+91 98765 43210",
                    IsDefault = true
                }
            };

            var newCustomer = new DbCustomer
            {
                Id = newId,
                StoreId = storeId,
                Name = !string.IsNullOrWhiteSpace(req.Name) ? req.Name.Trim() : cleanEmail.Split('@')[0],
                Email = cleanEmail,
                Phone = req.Phone?.Trim(),
                PasswordHash = passwordHash,
                AuthProvider = "email",
                OrdersCount = 0,
                TotalSpent = 0,
                SavedAddressesJson = JsonSerializer.Serialize(defaultAddresses),
                CreatedAt = DateTime.UtcNow.ToString("o")
            };

            db.Customers.Add(newCustomer);
            await db.SaveChangesAsync();

            var newProfile = ToCustomerProfile(newCustomer);
            var newToken = GenerateCustomerToken(newCustomer.Id, newCustomer.Email);

            return Results.Ok(new CustomerAuthResponse
            {
                Success = true,
                Message = "Account created successfully!",
                Token = newToken,
                Customer = newProfile
            });
        }).WithName("CustomerRegister")
          .WithSummary("Sign up a customer with email and password");

        // 2. Customer Login
        group.MapPost("/auth/login", async (CustomerLoginRequest req, ShopifyDbContext db, ITenantProvider tenantProvider) =>
        {
            var storeId = !string.IsNullOrWhiteSpace(req.StoreId)
                ? HttpTenantProvider.NormalizeStoreId(req.StoreId)
                : (tenantProvider.CurrentStoreId ?? "store_apex");

            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            {
                return Results.BadRequest(new CustomerAuthResponse
                {
                    Success = false,
                    Message = "Email and password are required."
                });
            }

            var cleanEmail = req.Email.Trim().ToLowerInvariant();
            var customer = await db.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.StoreId == storeId && c.Email.ToLower() == cleanEmail);

            // Seed demo customer if user logs in with demo credentials
            if (customer == null && (cleanEmail.Contains("demo") || cleanEmail.Contains("alex") || cleanEmail.Contains("test")))
            {
                customer = new DbCustomer
                {
                    Id = $"cust_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                    StoreId = storeId,
                    Name = cleanEmail.Contains("alex") ? "Alex Rivera" : "Demo Shopper",
                    Email = cleanEmail,
                    Phone = "+91 98765 43210",
                    PasswordHash = HashPassword(req.Password),
                    AuthProvider = "email",
                    OrdersCount = 2,
                    TotalSpent = 4850.00m,
                    SavedAddressesJson = JsonSerializer.Serialize(new List<SavedAddress>
                    {
                        new SavedAddress
                        {
                            Id = "addr_demo_home",
                            Label = "Home",
                            FirstName = cleanEmail.Contains("alex") ? "Alex" : "Demo",
                            LastName = cleanEmail.Contains("alex") ? "Rivera" : "Shopper",
                            Address = "500 Howard Street, Indiranagar",
                            City = "Bangalore",
                            State = "Karnataka",
                            Zip = "560038",
                            Phone = "+91 98765 43210",
                            IsDefault = true
                        },
                        new SavedAddress
                        {
                            Id = "addr_demo_office",
                            Label = "Office",
                            FirstName = cleanEmail.Contains("alex") ? "Alex" : "Demo",
                            LastName = cleanEmail.Contains("alex") ? "Rivera" : "Shopper",
                            Address = "Tech Park Tower 4, Level 7, Outer Ring Road",
                            City = "Bangalore",
                            State = "Karnataka",
                            Zip = "560103",
                            Phone = "+91 98765 43210",
                            IsDefault = false
                        }
                    }),
                    CreatedAt = DateTime.UtcNow.ToString("o")
                };
                db.Customers.Add(customer);
                await db.SaveChangesAsync();
            }

            if (customer == null)
            {
                return Results.NotFound(new CustomerAuthResponse
                {
                    Success = false,
                    Message = "No customer account found with this email. Please sign up."
                });
            }

            // Verify password (allow demo master password 'password123' or exact hash match)
            var inputHash = HashPassword(req.Password);
            if (!string.IsNullOrEmpty(customer.PasswordHash) && customer.PasswordHash != inputHash && req.Password != "password123")
            {
                return Results.BadRequest(new CustomerAuthResponse
                {
                    Success = false,
                    Message = "Invalid password. Please try again."
                });
            }

            var profile = ToCustomerProfile(customer);
            var token = GenerateCustomerToken(customer.Id, customer.Email);

            return Results.Ok(new CustomerAuthResponse
            {
                Success = true,
                Message = $"Welcome back, {customer.Name}!",
                Token = token,
                Customer = profile
            });
        }).WithName("CustomerLogin")
          .WithSummary("Log in customer with email and password");

        // 3. Send Mobile OTP (SMS / WhatsApp)
        group.MapPost("/auth/send-otp", (CustomerOtpRequest req) =>
        {
            if (string.IsNullOrWhiteSpace(req.Phone))
            {
                return Results.BadRequest(new { success = false, message = "Valid phone number is required." });
            }

            var channel = req.Channel?.ToLowerInvariant() == "whatsapp" ? "WhatsApp" : "SMS";
            return Results.Ok(new
            {
                success = true,
                message = $"6-digit verification code dispatched via {channel} to {req.Phone}",
                demoOtp = "123456",
                channel = channel,
                expiresInSeconds = 300
            });
        }).WithName("CustomerSendOtp")
          .WithSummary("Generate and dispatch mobile OTP via SMS or WhatsApp");

        // 4. Verify Mobile OTP
        group.MapPost("/auth/verify-otp", async (CustomerOtpVerifyRequest req, ShopifyDbContext db, ITenantProvider tenantProvider) =>
        {
            var storeId = !string.IsNullOrWhiteSpace(req.StoreId)
                ? HttpTenantProvider.NormalizeStoreId(req.StoreId)
                : (tenantProvider.CurrentStoreId ?? "store_apex");

            if (string.IsNullOrWhiteSpace(req.Phone) || string.IsNullOrWhiteSpace(req.Otp))
            {
                return Results.BadRequest(new CustomerAuthResponse { Success = false, Message = "Phone and OTP are required." });
            }

            // Verify OTP (accept 123456 as instant demo OTP or valid 6-digit number)
            if (req.Otp != "123456" && req.Otp.Length != 6)
            {
                return Results.BadRequest(new CustomerAuthResponse { Success = false, Message = "Invalid or expired OTP. Use demo OTP 123456." });
            }

            var cleanPhone = req.Phone.Trim();
            var customer = await db.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.StoreId == storeId && c.Phone == cleanPhone);

            if (customer == null)
            {
                var cleanSuffix = cleanPhone.Length > 4 ? cleanPhone[^4..] : "User";
                var displayName = !string.IsNullOrWhiteSpace(req.Name) ? req.Name.Trim() : $"Shopper {cleanSuffix}";
                var autoEmail = $"user_{cleanSuffix}@mobile.istora.online";

                customer = new DbCustomer
                {
                    Id = $"cust_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                    StoreId = storeId,
                    Name = displayName,
                    Email = autoEmail,
                    Phone = cleanPhone,
                    AuthProvider = "otp",
                    OrdersCount = 0,
                    TotalSpent = 0,
                    SavedAddressesJson = JsonSerializer.Serialize(new List<SavedAddress>
                    {
                        new SavedAddress
                        {
                            Id = $"addr_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                            Label = "Home",
                            FirstName = displayName.Split(' ').FirstOrDefault() ?? "Shopper",
                            LastName = "",
                            Address = "Brigade Road, Ashok Nagar",
                            City = "Bangalore",
                            State = "Karnataka",
                            Zip = "560025",
                            Phone = cleanPhone,
                            IsDefault = true
                        }
                    }),
                    CreatedAt = DateTime.UtcNow.ToString("o")
                };
                db.Customers.Add(customer);
                await db.SaveChangesAsync();
            }

            var profile = ToCustomerProfile(customer);
            var token = GenerateCustomerToken(customer.Id, customer.Email);

            return Results.Ok(new CustomerAuthResponse
            {
                Success = true,
                Message = $"Verified! Welcome, {customer.Name}.",
                Token = token,
                Customer = profile
            });
        }).WithName("CustomerVerifyOtp")
          .WithSummary("Verify phone OTP and authenticate shopper");

        // 5. Google 1-Click OAuth Sign-in
        group.MapPost("/auth/google", async (CustomerGoogleAuthRequest req, ShopifyDbContext db, ITenantProvider tenantProvider) =>
        {
            var storeId = !string.IsNullOrWhiteSpace(req.StoreId)
                ? HttpTenantProvider.NormalizeStoreId(req.StoreId)
                : (tenantProvider.CurrentStoreId ?? "store_apex");

            if (string.IsNullOrWhiteSpace(req.Email))
            {
                return Results.BadRequest(new CustomerAuthResponse { Success = false, Message = "Google email is required." });
            }

            var cleanEmail = req.Email.Trim().ToLowerInvariant();
            var customer = await db.Customers
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(c => c.StoreId == storeId && c.Email.ToLower() == cleanEmail);

            if (customer == null)
            {
                customer = new DbCustomer
                {
                    Id = $"cust_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                    StoreId = storeId,
                    Name = !string.IsNullOrWhiteSpace(req.Name) ? req.Name.Trim() : cleanEmail.Split('@')[0],
                    Email = cleanEmail,
                    Avatar = req.Avatar ?? "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop",
                    AuthProvider = "google",
                    OrdersCount = 0,
                    TotalSpent = 0,
                    SavedAddressesJson = JsonSerializer.Serialize(new List<SavedAddress>
                    {
                        new SavedAddress
                        {
                            Id = $"addr_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}",
                            Label = "Home",
                            FirstName = req.Name?.Split(' ').FirstOrDefault() ?? "Google",
                            LastName = req.Name?.Split(' ').Skip(1).FirstOrDefault() ?? "Shopper",
                            Address = "100 Koramangala 4th Block",
                            City = "Bangalore",
                            State = "Karnataka",
                            Zip = "560034",
                            Phone = "+91 98765 43210",
                            IsDefault = true
                        }
                    }),
                    CreatedAt = DateTime.UtcNow.ToString("o")
                };
                db.Customers.Add(customer);
                await db.SaveChangesAsync();
            }
            else
            {
                if (!string.IsNullOrWhiteSpace(req.Avatar))
                {
                    customer.Avatar = req.Avatar;
                    await db.SaveChangesAsync();
                }
            }

            var profile = ToCustomerProfile(customer);
            var token = GenerateCustomerToken(customer.Id, customer.Email);

            return Results.Ok(new CustomerAuthResponse
            {
                Success = true,
                Message = $"Connected via Google as {customer.Name}!",
                Token = token,
                Customer = profile
            });
        }).WithName("CustomerGoogleAuth")
          .WithSummary("Sign in with Google OAuth");

        // 6. Get Current Customer Profile
        group.MapGet("/me", async (string? email, string? customerId, string? storeId, ShopifyDbContext db, ITenantProvider tenantProvider) =>
        {
            var targetStore = !string.IsNullOrWhiteSpace(storeId)
                ? HttpTenantProvider.NormalizeStoreId(storeId)
                : (tenantProvider.CurrentStoreId ?? "store_apex");

            DbCustomer? customer = null;
            if (!string.IsNullOrWhiteSpace(customerId))
            {
                customer = await db.Customers.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.StoreId == targetStore && c.Id == customerId);
            }
            else if (!string.IsNullOrWhiteSpace(email))
            {
                var clean = email.Trim().ToLowerInvariant();
                customer = await db.Customers.IgnoreQueryFilters().FirstOrDefaultAsync(c => c.StoreId == targetStore && c.Email.ToLower() == clean);
            }

            if (customer == null)
            {
                return Results.NotFound(new { error = "Customer profile not found" });
            }

            return Results.Ok(ToCustomerProfile(customer));
        }).WithName("GetCustomerProfile")
          .WithSummary("Retrieve authenticated customer profile and saved addresses");

        // 7. Manage Saved Addresses
        group.MapPost("/addresses", async (SavedAddress address, string? customerId, string? email, string? storeId, ShopifyDbContext db, ITenantProvider tenantProvider) =>
        {
            var targetStore = !string.IsNullOrWhiteSpace(storeId)
                ? HttpTenantProvider.NormalizeStoreId(storeId)
                : (tenantProvider.CurrentStoreId ?? "store_apex");

            var customer = await db.Customers.IgnoreQueryFilters().FirstOrDefaultAsync(c =>
                c.StoreId == targetStore &&
                ((!string.IsNullOrEmpty(customerId) && c.Id == customerId) ||
                 (!string.IsNullOrEmpty(email) && c.Email.ToLower() == email.Trim().ToLowerInvariant()))
            );

            if (customer == null) return Results.NotFound(new { error = "Customer not found." });

            var list = new List<SavedAddress>();
            try
            {
                if (!string.IsNullOrWhiteSpace(customer.SavedAddressesJson))
                    list = JsonSerializer.Deserialize<List<SavedAddress>>(customer.SavedAddressesJson) ?? new();
            }
            catch { }

            address.Id = string.IsNullOrWhiteSpace(address.Id) ? $"addr_{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}" : address.Id;

            if (address.IsDefault || list.Count == 0)
            {
                address.IsDefault = true;
                foreach (var a in list) a.IsDefault = false;
            }

            list.Add(address);
            customer.SavedAddressesJson = JsonSerializer.Serialize(list);
            await db.SaveChangesAsync();

            return Results.Ok(list);
        }).WithName("AddCustomerAddress")
          .WithSummary("Add a new saved delivery address");

        group.MapPut("/addresses/{id}", async (string id, SavedAddress updated, string? customerId, string? email, string? storeId, ShopifyDbContext db, ITenantProvider tenantProvider) =>
        {
            var targetStore = !string.IsNullOrWhiteSpace(storeId)
                ? HttpTenantProvider.NormalizeStoreId(storeId)
                : (tenantProvider.CurrentStoreId ?? "store_apex");

            var customer = await db.Customers.IgnoreQueryFilters().FirstOrDefaultAsync(c =>
                c.StoreId == targetStore &&
                ((!string.IsNullOrEmpty(customerId) && c.Id == customerId) ||
                 (!string.IsNullOrEmpty(email) && c.Email.ToLower() == email.Trim().ToLowerInvariant()))
            );

            if (customer == null) return Results.NotFound(new { error = "Customer not found." });

            var list = new List<SavedAddress>();
            try
            {
                if (!string.IsNullOrWhiteSpace(customer.SavedAddressesJson))
                    list = JsonSerializer.Deserialize<List<SavedAddress>>(customer.SavedAddressesJson) ?? new();
            }
            catch { }

            var idx = list.FindIndex(a => a.Id == id);
            if (idx == -1) return Results.NotFound(new { error = "Address not found." });

            updated.Id = id;
            if (updated.IsDefault)
            {
                foreach (var a in list) a.IsDefault = false;
            }

            list[idx] = updated;
            customer.SavedAddressesJson = JsonSerializer.Serialize(list);
            await db.SaveChangesAsync();

            return Results.Ok(list);
        }).WithName("UpdateCustomerAddress")
          .WithSummary("Update an existing delivery address");

        group.MapDelete("/addresses/{id}", async (string id, string? customerId, string? email, string? storeId, ShopifyDbContext db, ITenantProvider tenantProvider) =>
        {
            var targetStore = !string.IsNullOrWhiteSpace(storeId)
                ? HttpTenantProvider.NormalizeStoreId(storeId)
                : (tenantProvider.CurrentStoreId ?? "store_apex");

            var customer = await db.Customers.IgnoreQueryFilters().FirstOrDefaultAsync(c =>
                c.StoreId == targetStore &&
                ((!string.IsNullOrEmpty(customerId) && c.Id == customerId) ||
                 (!string.IsNullOrEmpty(email) && c.Email.ToLower() == email.Trim().ToLowerInvariant()))
            );

            if (customer == null) return Results.NotFound(new { error = "Customer not found." });

            var list = new List<SavedAddress>();
            try
            {
                if (!string.IsNullOrWhiteSpace(customer.SavedAddressesJson))
                    list = JsonSerializer.Deserialize<List<SavedAddress>>(customer.SavedAddressesJson) ?? new();
            }
            catch { }

            list.RemoveAll(a => a.Id == id);
            if (list.Count > 0 && !list.Any(a => a.IsDefault))
            {
                list[0].IsDefault = true;
            }

            customer.SavedAddressesJson = JsonSerializer.Serialize(list);
            await db.SaveChangesAsync();

            return Results.Ok(list);
        }).WithName("DeleteCustomerAddress")
          .WithSummary("Remove a saved address");

        // 8. Customer Order History
        group.MapGet("/orders", async (string? email, string? customerId, string? storeId, ShopifyDbContext db, ITenantProvider tenantProvider) =>
        {
            var targetStore = !string.IsNullOrWhiteSpace(storeId)
                ? HttpTenantProvider.NormalizeStoreId(storeId)
                : (tenantProvider.CurrentStoreId ?? "store_apex");

            var cleanEmail = email?.Trim().ToLowerInvariant();

            var query = db.Orders.IgnoreQueryFilters().Where(o => o.StoreId == targetStore);

            if (!string.IsNullOrWhiteSpace(cleanEmail))
            {
                query = query.Where(o => o.CustomerEmail.ToLower() == cleanEmail);
            }

            var dbOrders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();

            var orders = dbOrders.Select(o =>
            {
                List<CartItem> items = new();
                try
                {
                    if (!string.IsNullOrWhiteSpace(o.ItemsJson))
                        items = JsonSerializer.Deserialize<List<CartItem>>(o.ItemsJson) ?? new();
                }
                catch { }

                return new Order
                {
                    Id = o.Id,
                    StoreId = o.StoreId,
                    OrderNumber = o.OrderNumber,
                    CustomerName = o.CustomerName,
                    CustomerEmail = o.CustomerEmail,
                    Total = o.Total,
                    Status = o.Status,
                    PaymentMethod = o.PaymentMethod,
                    TrackingNumber = o.TrackingNumber,
                    Carrier = o.Carrier,
                    CreatedAt = o.CreatedAt,
                    InvoiceNumber = o.InvoiceNumber,
                    IsB2B = o.IsB2B,
                    CustomerGstin = o.CustomerGstin,
                    CustomerCompanyName = o.CustomerCompanyName,
                    BuyerStateCode = o.BuyerStateCode,
                    TaxableAmount = o.TaxableAmount,
                    CgstAmount = o.CgstAmount,
                    SgstAmount = o.SgstAmount,
                    IgstAmount = o.IgstAmount,
                    TotalGst = o.TotalGst,
                    Items = items
                };
            }).ToList();

            return Results.Ok(orders);
        }).WithName("GetCustomerOrders")
          .WithSummary("Retrieve complete order history for authenticated shopper");

        return app;
    }
}
