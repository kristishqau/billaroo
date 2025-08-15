using Server.Services.Interfaces;

namespace Server.Services
{
    public class SecurityCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<SecurityCleanupService> _logger;
        private readonly TimeSpan _period = TimeSpan.FromHours(24); // Run daily

        public SecurityCleanupService(IServiceProvider serviceProvider, ILogger<SecurityCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var securityAuditService = scope.ServiceProvider.GetRequiredService<ISecurityAuditService>();

                    await securityAuditService.CleanupOldLogsAsync(90); // Keep 90 days of logs

                    _logger.LogInformation("Security cleanup completed at {Time}", DateTime.UtcNow);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error during security cleanup");
                }

                await Task.Delay(_period, stoppingToken);
            }
        }
    }
}
