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
builder.Services.AddHostedService<SecurityCleanupService>();

// JWT Configuration with environment variables fallback
var jwtKey = Environment.GetEnvironmentVariable("JWT_TOKEN") ??
             builder.Configuration.GetSection("AppSettings:Token").Value;

if (string.IsNullOrEmpty(jwtKey))
{
    throw new ArgumentException("JWT Token key is not configured. Set JWT_TOKEN environment variable or AppSettings:Token in configuration.");
}

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
app.MapGet("/health", () => new { Status = "Healthy", Environment = app.Environment.EnvironmentName, Timestamp = DateTime.UtcNow });

app.Run();
