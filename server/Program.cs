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

// ---------- Environment-specific configuration ----------
if (isProduction)
{
    Console.WriteLine("Loading production configuration from environment variables...");

    // Database
    var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
    if (!string.IsNullOrEmpty(databaseUrl))
    {
        builder.Configuration["ConnectionStrings:DefaultConnection"] = databaseUrl;
        Console.WriteLine("Database URL loaded from environment");
    }
    else
    {
        Console.WriteLine("WARNING: DATABASE_URL not found");
    }

    // JWT
    builder.Configuration["AppSettings:Token"] = Environment.GetEnvironmentVariable("JWT_TOKEN")
        ?? builder.Configuration["AppSettings:Token"];
    builder.Configuration["AppSettings:Issuer"] = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? "ClientPortalAPI";
    builder.Configuration["AppSettings:Audience"] = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? "ClientPortalUsers";

    // Data Protection
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo("/app/keys"))
        .SetApplicationName("ClientPortal")
        .SetDefaultKeyLifetime(TimeSpan.FromDays(90));

    // Email
    builder.Configuration["EmailSettings:Username"] = Environment.GetEnvironmentVariable("EMAIL_USERNAME") ?? builder.Configuration["EmailSettings:Username"];
    builder.Configuration["EmailSettings:Password"] = Environment.GetEnvironmentVariable("EMAIL_PASSWORD") ?? builder.Configuration["EmailSettings:Password"];
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
        var origins = allowedProdOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(o => o.Trim()).ToArray();
        for (int i = 0; i < origins.Length; i++)
            builder.Configuration[$"CorsSettings:AllowedOrigins:{i}"] = origins[i];

        Console.WriteLine($"CORS origins loaded: {string.Join(", ", origins)}");
    }
    else
    {
        builder.Configuration["CorsSettings:AllowedOrigins:0"] = "https://yourdomain.com";
        builder.Configuration["CorsSettings:AllowedOrigins:1"] = "https://www.yourdomain.com";
        Console.WriteLine("Using fallback CORS origins");
    }
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
            Description = "JWT Authorization header using Bearer scheme",
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
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                           ?? throw new ArgumentException("Database connection string is not configured.");

    Console.WriteLine($"Using connection string: {connectionString.Substring(0, Math.Min(50, connectionString.Length))}...");

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

builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));

// Hosted service only in non-development
if (!isDevelopment)
{
    builder.Services.AddHostedService<SecurityCleanupService>();
}

// ---------- JWT Authentication ----------
var jwtKey = Environment.GetEnvironmentVariable("JWT_TOKEN") ?? builder.Configuration["AppSettings:Token"];
if (string.IsNullOrEmpty(jwtKey)) throw new ArgumentException("JWT Token key is not configured.");

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
                OnAuthenticationFailed = context => { Console.WriteLine($"Auth failed: {context.Exception.Message}"); return Task.CompletedTask; },
                OnChallenge = context => { Console.WriteLine($"Challenge: {context.Error}"); return Task.CompletedTask; }
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

// ---------- QuestPDF ----------
QuestPDF.Settings.License = LicenseType.Community;

// ---------- Build app ----------
var app = builder.Build();

// ---------- Middleware ----------
Console.WriteLine($"Environment: {app.Environment.EnvironmentName}");
Console.WriteLine($"Content Root: {app.Environment.ContentRootPath}");
Console.WriteLine($"Web Root: {app.Environment.WebRootPath}");

if (isDevelopment)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.UseCors("AllowFrontend");

app.MapControllers();
app.Run();
