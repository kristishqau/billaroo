using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuestPDF.Infrastructure;
using Server.Data;
using Server.Services;
using Server.Services.Interfaces;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Detect environment
var isDevelopment = builder.Environment.IsDevelopment();
var isProduction = builder.Environment.IsProduction();

Console.WriteLine($"🔧 Starting application in {builder.Environment.EnvironmentName} environment");

// ---------- Environment-specific configuration ----------
if (isProduction)
{
    Console.WriteLine("Loading production configuration from environment variables...");

    // Database
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrEmpty(databaseUrl))
    {
        builder.Configuration["ConnectionStrings:DefaultConnection"] = databaseUrl;
        Console.WriteLine("✅ Database URL loaded from environment");
    }
    else
    {
        Console.WriteLine("❌ WARNING: DATABASE_URL not found");
    }

    // JWT
    var jwtToken = Environment.GetEnvironmentVariable("JWT_TOKEN");
    if (!string.IsNullOrEmpty(jwtToken))
    {
        builder.Configuration["AppSettings:Token"] = jwtToken;
        Console.WriteLine("✅ JWT Token loaded from environment");
    }

    builder.Configuration["AppSettings:Issuer"] = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "ClientPortalAPI";
    builder.Configuration["AppSettings:Audience"] = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "ClientPortalUsers";

    // Frontend URL Configuration
    var frontendUrl = Environment.GetEnvironmentVariable("FRONTEND_URL");
    if (!string.IsNullOrEmpty(frontendUrl))
    {
        builder.Configuration["AppSettings:FrontendUrl"] = frontendUrl;
        Console.WriteLine($"✅ Frontend URL loaded: {frontendUrl}");
    }
    else
    {
        builder.Configuration["AppSettings:FrontendUrl"] = "https://billaroo.netlify.app";
        Console.WriteLine("⚠️ Using default production frontend URL");
    }

    // Data Protection - Create directory if it doesn't exist
    var keyPath = "/app/keys";
    Directory.CreateDirectory(keyPath);
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(keyPath))
        .SetApplicationName("ClientPortal")
        .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

    // Email
    var emailUsername = Environment.GetEnvironmentVariable("EMAIL_USERNAME");
    var emailPassword = Environment.GetEnvironmentVariable("EMAIL_PASSWORD");
    if (!string.IsNullOrEmpty(emailUsername)) builder.Configuration["EmailSettings:Username"] = emailUsername;
    if (!string.IsNullOrEmpty(emailPassword)) builder.Configuration["EmailSettings:Password"] = emailPassword;

    builder.Configuration["EmailSettings:SmtpServer"] = Environment.GetEnvironmentVariable("SMTP_SERVER") ?? "smtp.gmail.com";
    builder.Configuration["EmailSettings:Port"] = Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587";
    builder.Configuration["EmailSettings:EnableSsl"] = Environment.GetEnvironmentVariable("SMTP_ENABLE_SSL") ?? "true";
    builder.Configuration["EmailSettings:FromEmail"] = Environment.GetEnvironmentVariable("FROM_EMAIL") ?? "invoices@billaroo.com";
    builder.Configuration["EmailSettings:FromName"] = Environment.GetEnvironmentVariable("FROM_NAME") ?? "Billaroo Team";

    // SMS
    builder.Configuration["SmsSettings:Provider"] = Environment.GetEnvironmentVariable("SMS_PROVIDER") ?? "Twilio";
    builder.Configuration["SmsSettings:DevelopmentMode"] = Environment.GetEnvironmentVariable("SMS_DEVELOPMENT_MODE") ?? "false";

    // CORS
    var allowedProdOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS");
    if (!string.IsNullOrEmpty(allowedProdOrigins))
    {
        var origins = allowedProdOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                       .Select(o => o.Trim())
                                       .ToArray();
        for (int i = 0; i < origins.Length; i++)
            builder.Configuration[$"CorsSettings:AllowedOrigins:{i}"] = origins[i];

        Console.WriteLine($"✅ CORS origins loaded: {string.Join(", ", origins)}");
    }
    else
    {
        // Fallback CORS for production
        builder.Configuration["CorsSettings:AllowedOrigins:0"] = "https://yourdomain.com";
        builder.Configuration["CorsSettings:AllowedOrigins:1"] = "https://www.yourdomain.com";
        Console.WriteLine("⚠️ Using fallback CORS origins");
    }
}
else
{
    // Development configuration
    builder.Configuration["AppSettings:FrontendUrl"] = "http://localhost:5173";
}

// ---------- Services ----------
builder.Services.AddControllers();

// Swagger (only in development)
if (isDevelopment)
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Client Portal API",
            Version = "v1",
            Description = "Freelancer client portal API with JWT authentication"
        });

        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using Bearer scheme. Enter 'Bearer' [space] and then your token.",
            Name = "Authorization",
            In = ParameterLocation.Header,
            Type = SecuritySchemeType.ApiKey,
            Scheme = "Bearer"
        });

        c.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                },
                Array.Empty<string>()
            }
        });
    });
}

// ---------- Database ----------
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    if (string.IsNullOrEmpty(connectionString))
    {
        throw new ArgumentException("❌ Database connection string is not configured. Set DATABASE_URL environment variable or ConnectionStrings:DefaultConnection in configuration.");
    }

    Console.WriteLine($"🗄️ Using connection string: {connectionString.Substring(0, Math.Min(50, connectionString.Length))}...");

    options.UseNpgsql(connectionString);

    if (isDevelopment)
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// ---------- Scoped Services ----------
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IPdfService, PdfService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();
builder.Services.AddScoped<ITwoFactorService, TwoFactorService>();
builder.Services.AddScoped<ISecurityAuditService, SecurityAuditService>();
builder.Services.AddScoped<IMessageService, MessageService>();

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
builder.Services.AddLogging(builder =>
{
    builder.AddConsole();
    builder.AddDebug();
});

// Hosted service only in production (avoid startup issues in development)
if (isProduction)
{
    builder.Services.AddHostedService<SecurityCleanupService>();
}

// ---------- JWT Authentication ----------
var jwtKey = Environment.GetEnvironmentVariable("JWT_TOKEN") ?? builder.Configuration["AppSettings:Token"];
if (string.IsNullOrEmpty(jwtKey))
{
    throw new ArgumentException("❌ JWT Token key is not configured. Set JWT_TOKEN environment variable or AppSettings:Token in configuration.");
}

Console.WriteLine($"🔐 JWT Key configured (length: {jwtKey.Length})");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = !isDevelopment,
            ValidIssuer = builder.Configuration["AppSettings:Issuer"],
            ValidateAudience = !isDevelopment,
            ValidAudience = builder.Configuration["AppSettings:Audience"],
            ValidateLifetime = true,
            ClockSkew = isDevelopment ? TimeSpan.FromMinutes(5) : TimeSpan.Zero,
            RequireExpirationTime = true,
            RequireSignedTokens = true
        };

        if (isDevelopment)
        {
            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    Console.WriteLine($"🔴 Auth failed: {context.Exception.Message}");
                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    Console.WriteLine($"🟡 Challenge: {context.Error}, {context.ErrorDescription}");
                    return Task.CompletedTask;
                }
            };
        }
    });

// ---------- Authorization ----------
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("FreelancerOnly", policy => policy.RequireRole("freelancer"));
    options.AddPolicy("ClientOnly", policy => policy.RequireRole("client"));
    options.AddPolicy("FreelancerOrClient", policy => policy.RequireRole("freelancer", "client"));
});

// ---------- CORS ----------
var allowedOrigins = builder.Configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>()
                     ?? new[] { "http://localhost:5173" };

Console.WriteLine($"🌐 CORS origins: {string.Join(", ", allowedOrigins)}");

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ---------- QuestPDF ----------
QuestPDF.Settings.License = LicenseType.Community;

// ---------- Build app ----------
var app = builder.Build();

// ---------- Configure pipeline ----------
Console.WriteLine($"🚀 Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"📂 Content Root: {app.Environment.ContentRootPath}");
Console.WriteLine($"🌐 Web Root: {app.Environment.WebRootPath}");

// Development middleware
if (isDevelopment)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Client Portal API v1");
        c.RoutePrefix = "swagger";
    });
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

// IMPORTANT: Only redirect to HTTPS if we're confident about the setup
// Railway and Render handle HTTPS termination differently
var forceHttps = Environment.GetEnvironmentVariable("FORCE_HTTPS")?.ToLowerInvariant() == "true";
if (isProduction && forceHttps)
{
    app.UseHttpsRedirection();
    Console.WriteLine("🔒 HTTPS redirection enabled");
}
else if (isProduction)
{
    Console.WriteLine("⚠️ HTTPS redirection disabled (suitable for Railway/Render)");
}

// CORS should be early in the pipeline
app.UseCors("AllowFrontend");

// Static files setup
if (string.IsNullOrEmpty(app.Environment.WebRootPath))
{
    app.Environment.WebRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
}

var uploadsPath = Path.Combine(app.Environment.WebRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    Console.WriteLine($"📁 Created uploads directory: {uploadsPath}");
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

// Authentication & Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controllers
app.MapControllers();

// Health check endpoints
app.MapGet("/health", (HttpContext context) =>
{
    var response = new
    {
        Status = "Healthy",
        Environment = app.Environment.EnvironmentName,
        Timestamp = DateTime.UtcNow,
        DatabaseConfigured = !string.IsNullOrEmpty(builder.Configuration.GetConnectionString("DefaultConnection")),
        JwtConfigured = !string.IsNullOrEmpty(jwtKey),
        FrontendUrl = builder.Configuration["AppSettings:FrontendUrl"],
        RequestScheme = context.Request.Scheme,
        RequestHost = context.Request.Host.ToString(),
        UserAgent = context.Request.Headers.UserAgent.ToString()
    };

    Console.WriteLine($"🩺 Health check from {context.Request.Headers.UserAgent} via {context.Request.Scheme}://{context.Request.Host}");
    return Results.Json(response);
});

// Separate endpoint for API testing
app.MapGet("/", () => new
{
    Message = "Client Portal API is running",
    Environment = app.Environment.EnvironmentName,
    Timestamp = DateTime.UtcNow,
    Version = "1.0.0"
});

// Test database connection on startup (production only)
if (isProduction)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await context.Database.CanConnectAsync();
        Console.WriteLine("✅ Database connection test successful");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Database connection test failed: {ex.Message}");
        // Don't throw here to allow app to start anyway
    }
}

Console.WriteLine("🚀 Application starting...");

app.Run();
