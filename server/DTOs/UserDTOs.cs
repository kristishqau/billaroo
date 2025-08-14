using System.ComponentModel.DataAnnotations;

namespace Server.DTOs
{
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
        public bool EmailNotifications { get; set; }
        public bool SmsNotifications { get; set; }
        public bool IsEmailVerified { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

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

        public string? TimeZone { get; set; }
        public bool? EmailNotifications { get; set; }
        public bool? SmsNotifications { get; set; }
    }

    public class UpdateAvatarDto
    {
        [Required]
        public required string ProfileImageUrl { get; set; }
    }

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
}