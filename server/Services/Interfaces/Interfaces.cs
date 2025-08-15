using Microsoft.AspNetCore.Http;

namespace Server.Services.Interfaces
{
    public interface ISmsService
    {
        Task<bool> SendSmsAsync(string phoneNumber, string message);
        Task<bool> SendVerificationCodeAsync(string phoneNumber, string code);
        bool ValidatePhoneNumber(string phoneNumber);
    }

    public interface IFileUploadService
    {
        Task<string> UploadImageAsync(IFormFile file, string folder);
        Task<string> UploadFileAsync(IFormFile file, string folder);
        Task<bool> DeleteFileAsync(string fileUrl);
        bool IsValidImageFormat(IFormFile file);
        bool IsValidDocumentFormat(IFormFile file);
        long GetMaxImageSize();
        long GetMaxDocumentSize();
    }

    public interface ITwoFactorService
    {
        string GenerateSecret();
        string GenerateQrCodeUrl(string email, string secret);
        bool ValidateCode(string secret, string code);
        string[] GenerateRecoveryCodes(int count = 10);
        bool ValidateRecoveryCode(string[] recoveryCodes, string code);
        string GenerateBackupCode();
    }

    public interface ISecurityAuditService
    {
        Task LogAsync(int userId, string action, string? details, HttpContext httpContext);
        Task LogAsync(int userId, string action, string? details, string? ipAddress = null, string? userAgent = null);
        Task<List<SecurityAuditLogDto>> GetUserAuditLogsAsync(int userId, int page = 1, int pageSize = 50);
        Task<List<SecurityAuditLogDto>> GetAuditLogsByActionAsync(string action, DateTime? from = null, DateTime? to = null);
        Task CleanupOldLogsAsync(int retentionDays = 90);
    }

    public class SecurityAuditLogDto
    {
        public int Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string? Details { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public DateTime Timestamp { get; set; }
    }
}
