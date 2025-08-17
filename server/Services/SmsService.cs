using Microsoft.EntityFrameworkCore;
using OtpNet;
using QRCoder;
using QuestPDF.Infrastructure;
using Server.Data;
using Server.Models;
using Server.Services.Interfaces;
using System.Drawing;
using System.Drawing.Imaging;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;

namespace Server.Services
{
    // SMS Service Implementation
    // SMS Service Implementation
    public class SmsService : ISmsService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SmsService> _logger;

        public SmsService(IConfiguration configuration, ILogger<SmsService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendSmsAsync(string phoneNumber, string message)
        {
            try
            {
                if (!ValidatePhoneNumber(phoneNumber))
                {
                    _logger.LogWarning("Invalid phone number format: {PhoneNumber}", phoneNumber);
                    return false;
                }

                // FOR DEVELOPMENT: Use a mock SMS service that always succeeds
                var isDevelopment = _configuration.GetValue<bool>("IsDevelopment", true);

                if (isDevelopment)
                {
                    // Store the verification code in a development cache/file for testing
                    await StoreVerificationCodeForDevelopment(phoneNumber, ExtractCodeFromMessage(message));
                    _logger.LogInformation("DEVELOPMENT SMS - Phone: {PhoneNumber}, Message: {Message}", phoneNumber, message);
                    return true;
                }
                else
                {
                    // TODO: Add your production SMS provider here (Twilio, AWS SNS, etc.)
                    // Example for Twilio:
                    // return await SendViaTwilio(phoneNumber, message);

                    _logger.LogWarning("Production SMS service not configured");
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send SMS to {PhoneNumber}", phoneNumber);
                return false;
            }
        }

        // DEVELOPMENT HELPER: Store codes for testing
        private async Task StoreVerificationCodeForDevelopment(string phoneNumber, string code)
        {
            try
            {
                var tempPath = Path.Combine(Path.GetTempPath(), "billaroo_dev_codes.txt");
                var entry = $"{DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} | {phoneNumber} | {code}{Environment.NewLine}";
                await File.AppendAllTextAsync(tempPath, entry);
                _logger.LogInformation("Verification code stored in: {TempPath}", tempPath);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to store development verification code");
            }
        }
        private string ExtractCodeFromMessage(string message)
        {
            var match = System.Text.RegularExpressions.Regex.Match(message, @"\b\d{6}\b");
            return match.Success ? match.Value : "";
        }

        public async Task<bool> SendVerificationCodeAsync(string phoneNumber, string code)
        {
            var message = $"Your Billaroo verification code is: {code}. This code will expire in 10 minutes.";
            return await SendSmsAsync(phoneNumber, message);
        }

        public bool ValidatePhoneNumber(string phoneNumber)
        {
            if (string.IsNullOrWhiteSpace(phoneNumber))
                return false;

            // Basic phone number validation (adjust regex based on your requirements)
            var phoneRegex = new Regex(@"^\+?[\d\s\-\(\)]{10,15}$");
            return phoneRegex.IsMatch(phoneNumber);
        }
    }

    // File Upload Service Implementation
    public class FileUploadService : IFileUploadService
    {
        private readonly IWebHostEnvironment _environment;
        private readonly ILogger<FileUploadService> _logger;
        private readonly IConfiguration _configuration;

        public FileUploadService(IWebHostEnvironment environment, ILogger<FileUploadService> logger, IConfiguration configuration)
        {
            _environment = environment;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task<string> UploadImageAsync(IFormFile file, string folder)
        {
            if (!IsValidImageFormat(file))
                throw new ArgumentException("Invalid image format");

            if (file.Length > GetMaxImageSize())
                throw new ArgumentException("File size exceeds maximum limit");

            return await UploadFileInternalAsync(file, folder);
        }

        public async Task<string> UploadFileAsync(IFormFile file, string folder)
        {
            if (file.Length > GetMaxDocumentSize())
                throw new ArgumentException("File size exceeds maximum limit");

            return await UploadFileInternalAsync(file, folder);
        }

        private async Task<string> UploadFileInternalAsync(IFormFile file, string folder)
        {
            try
            {
                var uploadsFolder = Path.Combine(_environment.WebRootPath, "uploads", folder);
                Directory.CreateDirectory(uploadsFolder);

                var uniqueFileName = $"{Guid.NewGuid()}_{file.FileName}";
                var filePath = Path.Combine(uploadsFolder, uniqueFileName);

                using var stream = new FileStream(filePath, FileMode.Create);
                await file.CopyToAsync(stream);

                // Return relative URL
                return $"/uploads/{folder}/{uniqueFileName}";
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload file {FileName} to folder {Folder}", file.FileName, folder);
                throw;
            }
        }

        public async Task<bool> DeleteFileAsync(string fileUrl)
        {
            try
            {
                if (string.IsNullOrEmpty(fileUrl))
                    return true;

                var filePath = Path.Combine(_environment.WebRootPath, fileUrl.TrimStart('/'));

                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    return true;
                }

                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete file {FileUrl}", fileUrl);
                return false;
            }
        }

        public bool IsValidImageFormat(IFormFile file)
        {
            var allowedTypes = new[] { "image/jpeg", "image/png", "image/gif", "image/webp" };
            return allowedTypes.Contains(file.ContentType?.ToLower());
        }

        public bool IsValidDocumentFormat(IFormFile file)
        {
            var allowedTypes = new[]
            {
                "application/pdf",
                "application/msword",
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "text/plain"
            };
            return allowedTypes.Contains(file.ContentType?.ToLower());
        }

        public long GetMaxImageSize() => 5 * 1024 * 1024; // 5MB
        public long GetMaxDocumentSize() => 10 * 1024 * 1024; // 10MB
    }

    // Two-Factor Authentication Service Implementation
    public class TwoFactorService : ITwoFactorService
    {
        private readonly ILogger<TwoFactorService> _logger;

        public TwoFactorService(ILogger<TwoFactorService> logger)
        {
            _logger = logger;
        }

        public string GenerateSecret()
        {
            var key = KeyGeneration.GenerateRandomKey(20);
            return Base32Encoding.ToString(key);
        }

        public string GenerateQrCodeUrl(string email, string secret)
        {
            var issuer = "Billaroo";
            var totpUri = $"otpauth://totp/{issuer}:{email}?secret={secret}&issuer={issuer}";

            using var qrGenerator = new QRCodeGenerator();
            using var qrCodeData = qrGenerator.CreateQrCode(totpUri, QRCodeGenerator.ECCLevel.Q);
            //using var qrCode = new QRCode(qrCodeData);
            //using var qrCodeImage = qrCode.GetGraphic(20);

            using var ms = new MemoryStream();
            //qrCodeImage.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
            var imageBytes = ms.ToArray();

            return $"data:image/png;base64,{Convert.ToBase64String(imageBytes)}";
        }

        public bool ValidateCode(string secret, string code)
        {
            try
            {
                var secretBytes = Base32Encoding.ToBytes(secret);
                var totp = new Totp(secretBytes);
                return totp.VerifyTotp(code, out long timeStepMatched, VerificationWindow.RfcSpecifiedNetworkDelay);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to validate 2FA code");
                return false;
            }
        }

        public string[] GenerateRecoveryCodes(int count = 10)
        {
            var codes = new string[count];
            using var rng = RandomNumberGenerator.Create();

            for (int i = 0; i < count; i++)
            {
                var bytes = new byte[4];
                rng.GetBytes(bytes);
                codes[i] = Convert.ToHexString(bytes).ToLower();
            }

            return codes;
        }

        public bool ValidateRecoveryCode(string[] recoveryCodes, string code)
        {
            return recoveryCodes?.Contains(code.ToLower()) == true;
        }

        public string GenerateBackupCode()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[8];
            rng.GetBytes(bytes);
            return Convert.ToHexString(bytes).ToLower();
        }
    }

    // Security Audit Service Implementation
    public class SecurityAuditService : ISecurityAuditService
    {
        private readonly AppDbContext _context;
        private readonly ILogger<SecurityAuditService> _logger;

        public SecurityAuditService(AppDbContext context, ILogger<SecurityAuditService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task LogAsync(int userId, string action, string? details, HttpContext httpContext)
        {
            var ipAddress = GetClientIpAddress(httpContext);
            var userAgent = httpContext.Request.Headers["User-Agent"].ToString();

            await LogAsync(userId, action, details, ipAddress, userAgent);
        }

        public async Task LogAsync(int userId, string action, string? details, string? ipAddress = null, string? userAgent = null)
        {
            try
            {
                var auditLog = new SecurityAuditLog
                {
                    UserId = userId,
                    Action = action,
                    Details = details,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    Timestamp = DateTime.UtcNow
                };

                _context.SecurityAuditLogs.Add(auditLog);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to log security audit for user {UserId}, action {Action}", userId, action);
            }
        }

        public async Task<List<SecurityAuditLogDto>> GetUserAuditLogsAsync(int userId, int page = 1, int pageSize = 50)
        {
            var skip = (page - 1) * pageSize;

            return await _context.SecurityAuditLogs
                .Where(sal => sal.UserId == userId)
                .OrderByDescending(sal => sal.Timestamp)
                .Skip(skip)
                .Take(pageSize)
                .Select(sal => new SecurityAuditLogDto
                {
                    Id = sal.Id,
                    Action = sal.Action,
                    Details = sal.Details,
                    IpAddress = sal.IpAddress,
                    UserAgent = sal.UserAgent,
                    Timestamp = sal.Timestamp
                })
                .ToListAsync();
        }

        public async Task<List<SecurityAuditLogDto>> GetAuditLogsByActionAsync(string action, DateTime? from = null, DateTime? to = null)
        {
            var query = _context.SecurityAuditLogs
                .Where(sal => sal.Action == action);

            if (from.HasValue)
                query = query.Where(sal => sal.Timestamp >= from.Value);

            if (to.HasValue)
                query = query.Where(sal => sal.Timestamp <= to.Value);

            return await query
                .OrderByDescending(sal => sal.Timestamp)
                .Select(sal => new SecurityAuditLogDto
                {
                    Id = sal.Id,
                    Action = sal.Action,
                    Details = sal.Details,
                    IpAddress = sal.IpAddress,
                    UserAgent = sal.UserAgent,
                    Timestamp = sal.Timestamp
                })
                .ToListAsync();
        }

        public async Task CleanupOldLogsAsync(int retentionDays = 90)
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-retentionDays);

            var oldLogs = await _context.SecurityAuditLogs
                .Where(sal => sal.Timestamp < cutoffDate)
                .ToListAsync();

            if (oldLogs.Any())
            {
                _context.SecurityAuditLogs.RemoveRange(oldLogs);
                await _context.SaveChangesAsync();

                _logger.LogInformation("Cleaned up {Count} old security audit logs older than {CutoffDate}",
                    oldLogs.Count, cutoffDate);
            }
        }

        private static string? GetClientIpAddress(HttpContext context)
        {
            return context.Connection.RemoteIpAddress?.ToString() ??
                   context.Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                   context.Request.Headers["X-Real-IP"].FirstOrDefault();
        }
    }
}
