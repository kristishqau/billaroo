using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class User
    {
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public required string Username { get; set; }

        [Required]
        [StringLength(255)]
        public required string Email { get; set; }

        [Required]
        public required byte[] PasswordHash { get; set; }

        [Required]
        public required byte[] PasswordSalt { get; set; }

        [Required]
        [StringLength(20)]
        public required string Role { get; set; }

        // Email verification
        public bool IsEmailVerified { get; set; } = false;
        public string? EmailVerificationToken { get; set; }

        // Phone verification (NEW)
        [StringLength(20)]
        public string? PhoneNumber { get; set; }
        public bool IsPhoneVerified { get; set; } = false;
        public string? PhoneVerificationCode { get; set; }
        public DateTime? PhoneVerificationExpiry { get; set; }

        // Password reset
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }

        // Account security
        public int FailedLoginAttempts { get; set; } = 0;
        public bool IsAccountLocked { get; set; } = false;
        public DateTime? LockoutEnd { get; set; }

        // Two-Factor Authentication (NEW)
        public bool TwoFactorEnabled { get; set; } = false;
        public string? TwoFactorSecret { get; set; }
        public string[]? TwoFactorRecoveryCodes { get; set; }
        public DateTime? LastTwoFactorUsed { get; set; }

        // Profile verification status (NEW)
        public bool IsProfileComplete { get; set; } = false;
        public bool IsIdentityVerified { get; set; } = false;
        public string? VerificationDocumentUrl { get; set; }
        public string? VerificationStatus { get; set; } // Pending, Approved, Rejected
        public DateTime? VerificationDate { get; set; }

        // Audit fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }

        // Enhanced profile information
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string? TimeZone { get; set; }

        // Professional information (NEW)
        public string? JobTitle { get; set; }
        public string? Company { get; set; }
        public string? Bio { get; set; }
        public string? Website { get; set; }
        public string? LinkedInUrl { get; set; }
        public string? GitHubUrl { get; set; }
        public string? TwitterUrl { get; set; }
        public string? PortfolioUrl { get; set; }

        // CV/Resume (NEW)
        public string? CvUrl { get; set; }
        public DateTime? CvUploadedAt { get; set; }

        // Address information (NEW)
        public string? Street { get; set; }
        public string? City { get; set; }
        public string? State { get; set; }
        public string? PostalCode { get; set; }
        public string? Country { get; set; }

        // Privacy settings (NEW)
        public bool ShowEmail { get; set; } = false;
        public bool ShowPhone { get; set; } = false;
        public bool ShowAddress { get; set; } = false;
        public bool AllowMessages { get; set; } = true;

        // Preferences
        public bool EmailNotifications { get; set; } = true;
        public bool SmsNotifications { get; set; } = false;
        public bool MarketingEmails { get; set; } = false;

        // Navigation properties
        public virtual ICollection<Project>? Projects { get; set; }
        public virtual ICollection<Invoice>? Invoices { get; set; }
        public virtual ICollection<LoginHistory>? LoginHistory { get; set; }
        public virtual ICollection<UserSkill>? Skills { get; set; }
    }

    // New entity for user skills (NEW)
    public class UserSkill
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public int ProficiencyLevel { get; set; } // 1-5 scale
        public bool IsVerified { get; set; } = false;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual User? User { get; set; }
    }

    // Enhanced login history
    public class LoginHistory
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime LoginTime { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public string? DeviceInfo { get; set; }
        public string? Location { get; set; } // City, Country based on IP
        public bool IsSuccessful { get; set; }
        public string? FailureReason { get; set; }
        public bool IsTwoFactorUsed { get; set; } = false;

        public virtual User? User { get; set; }
    }

    // Security audit log (NEW)
    public class SecurityAuditLog
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Action { get; set; } = string.Empty; // password_change, email_change, etc.
        public string? Details { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        public virtual User? User { get; set; }
    }

    // Email templates entity for customizable emails
    public class EmailTemplate
    {
        public int Id { get; set; }
        public string TemplateType { get; set; } = string.Empty; // "welcome", "password-reset", "verification"
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
