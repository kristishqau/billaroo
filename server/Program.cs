using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using QuestPDF.Infrastructure;
using Server.Data;
using Server.Services;
using Server.Services.Interfaces;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure Swagger/OpenAPI with JWT support
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

// Database configuration
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register AuthService
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IPdfService, PdfService>();
builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));

// JWT Configuration
var jwtKey = builder.Configuration.GetSection("AppSettings:Token").Value;
if (string.IsNullOrEmpty(jwtKey))
{
    throw new ArgumentException("JWT Token key is not configured in appsettings.json");
}

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateIssuer = false, // Changed to false for development
            ValidIssuer = builder.Configuration["AppSettings:Issuer"],
            ValidateAudience = false, // Changed to false for development
            ValidAudience = builder.Configuration["AppSettings:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(5), // Changed from TimeSpan.Zero to allow some clock skew
            RequireExpirationTime = true,
            RequireSignedTokens = true
        };

        // Add event handlers for debugging
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Token;
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                return Task.CompletedTask;
            }
        };
    });

// Add Authorization
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("FreelancerOnly", policy => policy.RequireRole("freelancer"));
    options.AddPolicy("ClientOnly", policy => policy.RequireRole("client"));
    options.AddPolicy("FreelancerOrClient", policy => policy.RequireRole("freelancer", "client"));
});

// Add CORS for frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp", policy =>
    {
        policy.WithOrigins("http://localhost:5173", "https://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

QuestPDF.Settings.License = LicenseType.Community;

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Client Portal API v1");
        c.RoutePrefix = "swagger";
    });
}

if (app.Environment.IsDevelopment())
{
    // Use CORS early in the pipeline
    app.UseCors("AllowReactApp");

    // ❌ Skip HTTPS redirection in dev to avoid preflight redirects
    // app.UseHttpsRedirection();
}
else
{
    // In production: Keep HTTPS redirection
    app.UseHttpsRedirection();
    app.UseCors("AllowReactApp");
}

// Add Authentication & Authorization middleware
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Map controllers
app.MapControllers();

app.Run();