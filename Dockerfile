# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy solution and backend project file
COPY ClientPortal.sln ./
COPY server/Server.csproj ./server/

# Restore dependencies
RUN dotnet restore ClientPortal.sln

# Copy backend source code
COPY server/. ./server/

# Build backend
RUN dotnet build ClientPortal.sln --no-restore -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish server/Server.csproj --no-build -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgdiplus \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy published app
COPY --from=publish /app/publish ./

# Create directories and set permissions
RUN mkdir -p /app/wwwroot/uploads && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Environment
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Server.dll"]
