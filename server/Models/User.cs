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
        public required string Role { get; set; }  // "freelancer" or "client"

        // Email verification
        public bool IsEmailVerified { get; set; } = false;
        public string? EmailVerificationToken { get; set; }

        // Password reset
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }

        // Account security
        public int FailedLoginAttempts { get; set; } = 0;
        public bool IsAccountLocked { get; set; } = false;
        public DateTime? LockoutEnd { get; set; }

        // Audit fields
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastLoginAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // Soft delete
        public bool IsDeleted { get; set; } = false;
        public DateTime? DeletedAt { get; set; }

        // Profile information
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string? PhoneNumber { get; set; }
        public string? TimeZone { get; set; }

        // Preferences
        public bool EmailNotifications { get; set; } = true;
        public bool SmsNotifications { get; set; } = false;

        // Navigation properties
        public virtual ICollection<Project>? Projects { get; set; }
        public virtual ICollection<Invoice>? Invoices { get; set; }
        public virtual ICollection<LoginHistory>? LoginHistory { get; set; }
    }

    // Separate entity for login history tracking
    public class LoginHistory
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public DateTime LoginTime { get; set; }
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }
        public bool IsSuccessful { get; set; }
        public string? FailureReason { get; set; }

        // Navigation property
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