using System.ComponentModel.DataAnnotations;

namespace Server.DTOs
{
    public class UserDto
    {
        public int Id { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Company { get; set; }
        public string? Role { get; set; }
        public string DisplayName => !string.IsNullOrEmpty(FirstName) && !string.IsNullOrEmpty(LastName)
            ? $"{FirstName} {LastName}" : Username ?? "Unknown";
    }

    public class UserDetailDto
    {
        public int Id { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Company { get; set; }
        public string? Role { get; set; }
        public string DisplayName => !string.IsNullOrEmpty(FirstName) && !string.IsNullOrEmpty(LastName)
            ? $"{FirstName} {LastName}" : Username ?? "Unknown";

        // Business metrics (for clients viewed by freelancers)
        public int ProjectCount { get; set; }
        public decimal TotalInvoiceAmount { get; set; }
        public decimal PaidInvoiceAmount { get; set; }
        public DateTime? LastActivity { get; set; }
        public bool IsActive { get; set; }
    }

    // Client stats DTO for freelancer dashboard
    public class ClientStatsDto
    {
        public int TotalClients { get; set; }
        public int ClientsWithProjects { get; set; }
        public int ClientsWithUnpaidInvoices { get; set; }
        public object? TopClientsByRevenue { get; set; }
        public int ActiveClientsThisMonth { get; set; }
        public int NewClientsThisMonth { get; set; }
    }
    public class UserProfileDto
    {
        public int Id { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string? PhoneNumber { get; set; }
        public string? TimeZone { get; set; }

        // Professional info
        public string? JobTitle { get; set; }
        public string? Company { get; set; }
        public string? Bio { get; set; }
        public string? Website { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? GitHubUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? PortfolioUrl { get; set; }
        public string? CvUrl { get; set; }
        public DateTime? CvUploadedAt { get; set; }

        // Address
        public string? Street { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }

        // Verification status
        public bool IsEmailVerified { get; set; }
        public bool IsPhoneVerified { get; set; }
        public bool IsIdentityVerified { get; set; }
        public bool IsProfileComplete { get; set; }
        public string? VerificationStatus { get; set; }

        // Privacy settings
        public bool ShowEmail { get; set; }
        public bool ShowPhone { get; set; }
        public bool ShowAddress { get; set; }
        public bool AllowMessages { get; set; }

        // Preferences
        public bool EmailNotifications { get; set; }
        public bool SmsNotifications { get; set; }
        public bool MarketingEmails { get; set; }

        // Security
        public bool TwoFactorEnabled { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }

        // Skills
        public List<UserSkillDto>? Skills { get; set; }
    }

    // Enhanced Update Profile DTO
    public class UpdateProfileDto
    {
        [StringLength(50, MinimumLength = 3)]
        public string? Username { get; set; }

        [EmailAddress]
        public string? Email { get; set; }

        [StringLength(50)]
        public string? FirstName { get; set; }

        [StringLength(50)]
        public string? LastName { get; set; }

        [Phone]
        public string? PhoneNumber { get; set; }

        [StringLength(100)]
        public string? JobTitle { get; set; }

        [StringLength(100)]
        public string? Company { get; set; }

        [StringLength(1000)]
        public string? Bio { get; set; }

        [Url]
        public string? Website { get; set; }

        [Url]
        public string? LinkedInUrl { get; set; }

        [Url]
        public string? GitHubUrl { get; set; }

        [Url]
        public string? TwitterUrl { get; set; }

        [Url]
        public string? PortfolioUrl { get; set; }

        // Address
        [StringLength(200)]
        public string? Street { get; set; }

        [StringLength(100)]
        public string? City { get; set; }

        [StringLength(50)]
        public string? State { get; set; }

        [StringLength(20)]
        public string? PostalCode { get; set; }

        [StringLength(50)]
        public string? Country { get; set; }

        public string? TimeZone { get; set; }

        // Privacy settings
        public bool? ShowEmail { get; set; }
        public bool? ShowPhone { get; set; }
        public bool? ShowAddress { get; set; }
        public bool? AllowMessages { get; set; }

        // Preferences
        public bool? EmailNotifications { get; set; }
        public bool? SmsNotifications { get; set; }
        public bool? MarketingEmails { get; set; }
    }

    // Phone Verification DTOs (NEW)
    public class SendPhoneVerificationDto
    {
        [Required]
        [Phone]
        public required string PhoneNumber { get; set; }
    }

    public class VerifyPhoneDto
    {
        [Required]
        public required string VerificationCode { get; set; }
    }

    // Two-Factor Authentication DTOs (NEW)
    public class EnableTwoFactorDto
    {
        [Required]
        public required string Password { get; set; }
    }

    public class ConfirmTwoFactorDto
    {
        [Required]
        public required string Code { get; set; }
    }

    public class DisableTwoFactorDto
    {
        [Required]
        public required string Password { get; set; }

        [Required]
        public required string TwoFactorCode { get; set; }
    }

    // CV Upload DTO (NEW)
    public class UploadCvDto
    {
        [Required]
        public required IFormFile CvFile { get; set; }
    }

    // Skills DTOs (NEW)
    public class UserSkillDto
    {
        public int Id { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public int ProficiencyLevel { get; set; }
        public bool IsVerified { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AddSkillDto
    {
        [Required]
        [StringLength(50)]
        public required string SkillName { get; set; }

        [Range(1, 5)]
        public int ProficiencyLevel { get; set; } = 3;
    }

    // Identity Verification DTO (NEW)
    public class UploadVerificationDocumentDto
    {
        [Required]
        public required IFormFile Document { get; set; }

        [Required]
        [StringLength(20)]
        public required string DocumentType { get; set; } // passport, drivers_license, national_id
    }

    // Privacy Settings DTO (NEW)
    public class UpdatePrivacySettingsDto
    {
        public bool ShowEmail { get; set; }
        public bool ShowPhone { get; set; }
        public bool ShowAddress { get; set; }
        public bool AllowMessages { get; set; }
    }

    // Security Settings DTO (NEW)
    public class SecuritySettingsDto
    {
        public bool TwoFactorEnabled { get; set; }
        public bool IsPhoneVerified { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool IsIdentityVerified { get; set; }
        public DateTime? LastPasswordChange { get; set; }
        public List<LoginHistoryDto>? RecentLogins { get; set; }
    }

    public class LoginHistoryDto
    {
        public DateTime LoginTime { get; set; }
        public string? IpAddress { get; set; }
        public string? DeviceInfo { get; set; }
        public string? Location { get; set; }
        public bool IsSuccessful { get; set; }
        public bool IsTwoFactorUsed { get; set; }
    }

    // Profile Completion DTO (NEW)
    public class ProfileCompletionDto
    {
        public bool HasBasicInfo { get; set; }
        public bool HasContactInfo { get; set; }
        public bool HasProfessionalInfo { get; set; }
        public bool HasSkills { get; set; }
        public bool HasVerification { get; set; }
        public int CompletionPercentage { get; set; }
        public List<string> MissingFields { get; set; } = new();
    }

    // Enhanced Account Summary
    public class AccountSummaryDto
    {
        public int ClientCount { get; set; }
        public int ProjectCount { get; set; }
        public int InvoiceCount { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal PendingRevenue { get; set; }
        public bool HasUnpaidInvoices { get; set; }
        public bool HasActiveProjects { get; set; }
        public bool CanDeleteAccount { get; set; }
        public DateTime LastActivity { get; set; }
        public int TotalClients { get; set; }
        public int ActiveProjects { get; set; }
        public decimal ThisMonthRevenue { get; set; }

        // New security metrics
        public ProfileCompletionDto ProfileCompletion { get; set; } = new();
        public SecuritySettingsDto SecurityStatus { get; set; } = new();
        public int UnreadNotifications { get; set; }
        public bool HasPendingVerifications { get; set; }
    }

    public class AccountDeletionRequestDto
    {
        [Required]
        public required string Password { get; set; }

        public bool ForceDelete { get; set; } = false;
        public bool AcknowledgeDataLoss { get; set; } = false;
        public string? Reason { get; set; } // Optional reason for deletion
    }

    public class ConfirmAccountDeletionDto
    {
        [Required]
        public required string Password { get; set; }

        [Required]
        public required string ConfirmationText { get; set; } // Must be "DELETE MY ACCOUNT"
    }

    public class UploadImageDto
    {
        [Required]
        public required IFormFile File { get; set; }
    }

    public class UserPreferencesDto
    {
        public bool EmailNotifications { get; set; }
        public bool SmsNotifications { get; set; }
        public bool ProjectNotifications { get; set; }
        public bool InvoiceNotifications { get; set; }
        public bool MarketingEmails { get; set; }
        public string? TimeZone { get; set; }
        public string? DateFormat { get; set; }
        public string? CurrencyCode { get; set; }
        public string? Language { get; set; }
    }

    public class UserStatsDto
    {
        public int TotalProjects { get; set; }
        public int CompletedProjects { get; set; }
        public int ActiveProjects { get; set; }
        public decimal TotalEarnings { get; set; }
        public decimal CurrentMonthEarnings { get; set; }
        public int TotalClients { get; set; }
        public int ActiveClients { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public int DaysActive { get; set; }
        public double AverageProjectValue { get; set; }
    }

    public class UserSearchResultDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Email { get; set; }
        public string Role { get; set; } = string.Empty;
        public string? Company { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string DisplayName { get; set; } = string.Empty;
        public bool IsOnline { get; set; }
    }
}
