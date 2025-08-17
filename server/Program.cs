using Microsoft.AspNetCore.Authentication.JwtBearer;
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

// Environment detection
var isDevelopment = builder.Environment.IsDevelopment();
var isProduction = builder.Environment.IsProduction();

// Load configuration from environment variables in production
if (isProduction)
{
    Console.WriteLine("Loading production configuration from environment variables...");

    // Database connection
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrEmpty(databaseUrl))
    {
        builder.Configuration["ConnectionStrings:DefaultConnection"] = databaseUrl;
        Console.WriteLine("Database URL loaded from environment");
    }
    else
    {
        Console.WriteLine("WARNING: DATABASE_URL environment variable not found");
    }

    // JWT Settings
    var jwtToken = Environment.GetEnvironmentVariable("JWT_TOKEN");
    var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "ClientPortalAPI";
    var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "ClientPortalUsers";

    if (!string.IsNullOrEmpty(jwtToken))
    {
        builder.Configuration["AppSettings:Token"] = jwtToken;
        Console.WriteLine("JWT Token loaded from environment");
    }
    else
    {
        Console.WriteLine("WARNING: JWT_TOKEN environment variable not found");
    }

    builder.Configuration["AppSettings:Issuer"] = jwtIssuer;
    builder.Configuration["AppSettings:Audience"] = jwtAudience;

    // Email Settings
    var emailUsername = Environment.GetEnvironmentVariable("EMAIL_USERNAME");
    var emailPassword = Environment.GetEnvironmentVariable("EMAIL_PASSWORD");
    var smtpServer = Environment.GetEnvironmentVariable("SMTP_SERVER") ?? "smtp.gmail.com";
    var smtpPort = Environment.GetEnvironmentVariable("SMTP_PORT") ?? "587";
    var smtpSsl = Environment.GetEnvironmentVariable("SMTP_ENABLE_SSL") ?? "true";
    var fromEmail = Environment.GetEnvironmentVariable("FROM_EMAIL") ?? "invoices@billaroo.com";
    var fromName = Environment.GetEnvironmentVariable("FROM_NAME") ?? "Billaroo Team";

    if (!string.IsNullOrEmpty(emailUsername)) builder.Configuration["EmailSettings:Username"] = emailUsername;
    if (!string.IsNullOrEmpty(emailPassword)) builder.Configuration["EmailSettings:Password"] = emailPassword;

    builder.Configuration["EmailSettings:SmtpServer"] = smtpServer;
    builder.Configuration["EmailSettings:Port"] = smtpPort;
    builder.Configuration["EmailSettings:EnableSsl"] = smtpSsl;
    builder.Configuration["EmailSettings:FromEmail"] = fromEmail;
    builder.Configuration["EmailSettings:FromName"] = fromName;

    // SMS Settings
    var smsProvider = Environment.GetEnvironmentVariable("SMS_PROVIDER") ?? "Twilio";
    var smsDevelopmentMode = Environment.GetEnvironmentVariable("SMS_DEVELOPMENT_MODE") ?? "false";

    builder.Configuration["SmsSettings:Provider"] = smsProvider;
    builder.Configuration["SmsSettings:DevelopmentMode"] = smsDevelopmentMode;

    // CORS Settings
    var allowedProdOrigins = Environment.GetEnvironmentVariable("ALLOWED_ORIGINS");
    if (!string.IsNullOrEmpty(allowedProdOrigins))
    {
        var origins = allowedProdOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries)
                                  .Select(o => o.Trim())
                                  .ToArray();

        // Clear existing origins and set new ones
        for (int i = 0; i < origins.Length; i++)
        {
            builder.Configuration[$"CorsSettings:AllowedOrigins:{i}"] = origins[i];
        }
        Console.WriteLine($"CORS origins loaded: {string.Join(", ", origins)}");
    }
    else
    {
        // Fallback CORS origins for production
        builder.Configuration["CorsSettings:AllowedOrigins:0"] = "https://yourdomain.com";
        builder.Configuration["CorsSettings:AllowedOrigins:1"] = "https://www.yourdomain.com";
        Console.WriteLine("Using fallback CORS origins");
    }
}

// Add services to the container.
builder.Services.AddControllers();

// Configure Swagger/OpenAPI with JWT support (only in development)
if (isDevelopment)
{
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(c =>
    {
        c.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Client Portal API",
            Version = "v1",
            Description = "A freelancer client portal API with JWT authentication"
        });

        // Configure JWT authentication in Swagger
        c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token in the text input below.",
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
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                Array.Empty<string>()
            }
        });
    });
}

// Database configuration
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

    if (string.IsNullOrEmpty(connectionString))
    {
        throw new ArgumentException("Database connection string is not configured. Set DATABASE_URL environment variable or ConnectionStrings:DefaultConnection in configuration.");
    }

    Console.WriteLine($"Using connection string: {connectionString.Substring(0, Math.Min(50, connectionString.Length))}...");

    options.UseNpgsql(connectionString);

    // Enable sensitive data logging only in development
    if (isDevelopment)
    {
        options.EnableSensitiveDataLogging();
        options.EnableDetailedErrors();
    }
});

// Register services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IPdfService, PdfService>();
builder.Services.AddScoped<ISmsService, SmsService>();
builder.Services.AddScoped<IFileUploadService, FileUploadService>();
builder.Services.AddScoped<ITwoFactorService, TwoFactorService>();
builder.Services.AddScoped<ISecurityAuditService, SecurityAuditService>();

// Configure settings
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));

// Only add SecurityCleanupService if not in development to avoid the connection issue during startup
if (!isDevelopment)
{
    builder.Services.AddHostedService<SecurityCleanupService>();
}

// JWT Configuration with environment variables fallback
var jwtKey = Environment.GetEnvironmentVariable("JWT_TOKEN") ??
             builder.Configuration.GetSection("AppSettings:Token").Value;

if (string.IsNullOrEmpty(jwtKey))
{
    throw new ArgumentException("JWT Token key is not configured. Set JWT_TOKEN environment variable or AppSettings:Token in configuration.");
}

Console.WriteLine($"JWT Key configured (length: {jwtKey.Length})");

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

        // Add event handlers for debugging in development only
        if (isDevelopment)
        {
            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    Console.WriteLine($"Authentication failed: {context.Exception.Message}");
                    return Task.CompletedTask;
                },
                OnChallenge = context =>
                {
                    Console.WriteLine($"Challenge: {context.Error}, {context.ErrorDescription}");
                    return Task.CompletedTask;
                }
            };
        }
    });

// Add Authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("FreelancerOnly", policy => policy.RequireRole("freelancer"));
    options.AddPolicy("ClientOnly", policy => policy.RequireRole("client"));
    options.AddPolicy("FreelancerOrClient", policy => policy.RequireRole("freelancer", "client"));
});

// Add CORS with environment-specific origins
var allowedOrigins = builder.Configuration.GetSection("CorsSettings:AllowedOrigins").Get<string[]>() ??
                    new[] { "http://localhost:5173" };

Console.WriteLine($"CORS origins: {string.Join(", ", allowedOrigins)}");

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

// QuestPDF License
QuestPDF.Settings.License = LicenseType.Community;

var app = builder.Build();

// Log startup information
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"Content Root: {app.Environment.ContentRootPath}");
Console.WriteLine($"Web Root: {app.Environment.WebRootPath}");

// Configure the HTTP request pipeline based on environment
if (isDevelopment)
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Client Portal API v1");
        c.RoutePrefix = "swagger";
    });

    app.UseDeveloperExceptionPage();
    // Skip HTTPS redirection in development
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
    app.UseHttpsRedirection();
}

// CORS should be early in pipeline
app.UseCors("AllowFrontend");

// Ensure wwwroot exists
if (string.IsNullOrEmpty(app.Environment.WebRootPath))
{
    app.Environment.WebRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
}

// Create uploads directory if it doesn't exist
var uploadsPath = Path.Combine(app.Environment.WebRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
    Console.WriteLine($"Created uploads directory: {uploadsPath}");
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

// Health check endpoint
app.MapGet("/health", () => new
{
    Status = "Healthy",
    Environment = app.Environment.EnvironmentName,
    Timestamp = DateTime.UtcNow,
    DatabaseConfigured = !string.IsNullOrEmpty(builder.Configuration.GetConnectionString("DefaultConnection")),
    JwtConfigured = !string.IsNullOrEmpty(jwtKey)
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
    }
}

Console.WriteLine("🚀 Application starting...");

app.Run();
