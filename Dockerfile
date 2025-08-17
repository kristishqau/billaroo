# ========================
# Build stage
# ========================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution file first
COPY ClientPortal.sln ./

# Copy all csproj files
COPY Server/*.csproj ./Server/
# COPY Client/*.csproj ./Client/  # uncomment if you have a client .csproj

# Restore dependencies
RUN dotnet restore ClientPortal.sln

# Copy everything else
COPY . .
RUN dotnet build ClientPortal.sln --no-restore -c Release -o /app/build

# ========================
# Publish stage
# ========================
FROM build AS publish
RUN dotnet publish Server/Server.csproj --no-build -c Release -o /app/publish

# ========================
# Runtime stage
# ========================
FROM mcr.microsoft.com/dotnet/aspnet:9.0-bullseye-slim AS runtime
WORKDIR /app

# Install only required system dependencies (libgdiplus for PDFs / System.Drawing)
RUN apt-get update && \
    apt-get install -y --no-install-recommends libgdiplus && \
    rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published app
COPY --from=publish /app/publish .

# Create directories and set permissions
RUN mkdir -p /app/wwwroot/uploads && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Server.dll"]
