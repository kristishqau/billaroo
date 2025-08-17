# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy solution and project files (match actual folder names)
COPY server/Server.csproj ./server/
COPY ClientPortal.sln ./

# Restore dependencies
RUN dotnet restore ClientPortal.sln

# Copy everything else
COPY . .

# Build
RUN dotnet build ClientPortal.sln --no-restore -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish server/Server.csproj --no-build -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

RUN apt-get update && apt-get install -y libgdiplus libc6-dev && rm -rf /var/lib/apt/lists/*

RUN groupadd -r appuser && useradd -r -g appuser appuser

COPY --from=publish /app/publish .

RUN mkdir -p /app/wwwroot/uploads && chown -R appuser:appuser /app

USER appuser

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "Server.dll"]
