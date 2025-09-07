using System.ComponentModel.DataAnnotations;

namespace Server.DTOs
{
    public class RegisterDto
    {
        [Required]
        [StringLength(50, MinimumLength = 3, ErrorMessage = "Username must be between 3 and 50 characters")]
        public required string Username { get; set; }

        [Required]
        [EmailAddress(ErrorMessage = "Please enter a valid email address")]
        public required string Email { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
        public required string Password { get; set; }

        [Required]
        public required string Role { get; set; } // "freelancer" or "client"
    }

    public class LoginDto
    {
        [Required(ErrorMessage = "Username is required")]
        public required string Username { get; set; }

        [Required(ErrorMessage = "Password is required")]
        public required string Password { get; set; }

        public bool RememberMe { get; set; } = false;
    }

    public class ForgotPasswordDto
    {
        [Required]
        [EmailAddress(ErrorMessage = "Please enter a valid email address")]
        public required string Email { get; set; }
    }

    public class ResetPasswordDto
    {
        [Required]
        public required string Token { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
        public required string NewPassword { get; set; }
    }

    public class VerifyEmailDto
    {
        [Required]
        public required string Token { get; set; }
    }

    public class ChangePasswordDto
    {
        [Required]
        public required string CurrentPassword { get; set; }

        [Required]
        [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be at least 6 characters")]
        public required string NewPassword { get; set; }

        [Required]
        [Compare("NewPassword", ErrorMessage = "Passwords do not match")]
        public required string ConfirmPassword { get; set; }
    }

    public class AuthResponseDto
    {
        public int Id { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public string? Token { get; set; }
        public bool IsEmailVerified { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    public class CurrentUserDto
    {
        public int Id { get; set; }
        public string? Username { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public bool IsEmailVerified { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class PasswordValidationDto
    {
        public bool IsValid { get; set; }
        public string? Strength { get; set; } // "weak", "medium", "strong"
        public List<string> Requirements { get; set; } = new List<string>();
        public List<string> Violations { get; set; } = new List<string>();
        public int Score { get; set; }
    }

    public class ValidatePasswordRequestDto
    {
        [Required]
        public required string Password { get; set; }
    }

    public class CheckAvailabilityDto
    {
        public string? Username { get; set; }
        public string? Email { get; set; }
    }

    public class AvailabilityResponseDto
    {
        public bool IsUsernameAvailable { get; set; }
        public bool IsEmailAvailable { get; set; }
        public string? UsernameMessage { get; set; }
        public string? EmailMessage { get; set; }
    }

    public class AccountStatusDto
    {
        public bool IsActive { get; set; }
        public bool IsEmailVerified { get; set; }
        public bool IsAccountLocked { get; set; }
        public DateTime? LockoutEnd { get; set; }
        public int FailedLoginAttempts { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? LastLoginAt { get; set; }
        public bool RequiresPasswordChange { get; set; }
    }

    public class ResendVerificationDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
    }

    public class UnlockAccountDto
    {
        [Required]
        [EmailAddress]
        public required string Email { get; set; }
    }

    // Response DTOs for better API responses
    public class ApiResponseDto<T>
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public T? Data { get; set; }
        public List<string>? Errors { get; set; }
    }

    public class AuthApiResponseDto : ApiResponseDto<AuthResponseDto>
    {
        public bool RequiresEmailVerification { get; set; }
        public bool IsFirstLogin { get; set; }
    }
}
