using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Services;
using Server.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuthService _authService;
        private readonly IEmailService _emailService;

        public AuthController(AppDbContext context, IAuthService authService, IEmailService emailService)
        {
            _context = context;
            _authService = authService;
            _emailService = emailService;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto request)
        {
            try
            {
                // Validate password strength
                var passwordValidation = _authService.ValidatePassword(request.Password);
                if (!passwordValidation.IsValid)
                {
                    return BadRequest($"Password validation failed: {string.Join(", ", passwordValidation.Violations)}");
                }

                // Validate username format
                if (!_authService.IsValidUsername(request.Username))
                {
                    return BadRequest("Username format is invalid. Must be 3-50 characters, start with letter/number, and contain only letters, numbers, hyphens, and underscores.");
                }

                // Validate email format
                if (!_authService.IsValidEmail(request.Email))
                {
                    return BadRequest("Email format is invalid");
                }

                // Validate role
                if (request.Role != "freelancer" && request.Role != "client")
                {
                    return BadRequest("Role must be either 'freelancer' or 'client'");
                }

                // Check if user already exists
                if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                {
                    return BadRequest("Username already exists");
                }

                if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                {
                    return BadRequest("Email already exists");
                }

                // Create password hash
                _authService.CreatePasswordHash(request.Password, out byte[] passwordHash, out byte[] passwordSalt);

                // Create user
                var user = new User
                {
                    Username = request.Username,
                    Email = request.Email,
                    PasswordHash = passwordHash,
                    PasswordSalt = passwordSalt,
                    Role = request.Role,
                    IsEmailVerified = false,
                    EmailVerificationToken = GenerateVerificationToken(),
                    CreatedAt = DateTime.UtcNow,
                    LastLoginAt = null,
                    FailedLoginAttempts = 0,
                    IsAccountLocked = false
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Send welcome email
                try
                {
                    await SendWelcomeEmail(user);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Failed to send welcome email: {ex.Message}");
                    // Don't fail registration if email fails
                }

                // Generate JWT token
                var token = _authService.CreateToken(user);

                return Ok(new AuthResponseDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    Token = token,
                    IsEmailVerified = user.IsEmailVerified,
                    LastLoginAt = user.LastLoginAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Registration error: {ex.Message}");
                return StatusCode(500, "An error occurred during registration");
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto request)
        {
            try
            {
                // Find user by username
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == request.Username);

                if (user == null)
                {
                    return BadRequest("Invalid username or password");
                }

                // Check if account is locked
                if (user.IsAccountLocked && user.LockoutEnd > DateTime.UtcNow)
                {
                    var remainingTime = user.LockoutEnd.Value.Subtract(DateTime.UtcNow);
                    return BadRequest($"Account is locked. Try again in {Math.Ceiling(remainingTime.TotalMinutes)} minutes.");
                }

                // Verify password
                if (!_authService.VerifyPasswordHash(request.Password, user.PasswordHash, user.PasswordSalt))
                {
                    // Increment failed login attempts
                    await HandleFailedLogin(user);
                    return BadRequest("Invalid username or password");
                }

                // Reset failed login attempts and update last login on successful login
                user.FailedLoginAttempts = 0;
                user.IsAccountLocked = false;
                user.LockoutEnd = null;
                user.LastLoginAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Generate JWT token
                var token = _authService.CreateToken(user);

                return Ok(new AuthResponseDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    Token = token,
                    IsEmailVerified = user.IsEmailVerified,
                    LastLoginAt = user.LastLoginAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login error: {ex.Message}");
                return StatusCode(500, "An error occurred during login");
            }
        }

        [HttpPost("forgot-password")]
        public async Task<ActionResult> ForgotPassword(ForgotPasswordDto request)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                // Always return success to prevent email enumeration
                if (user == null)
                {
                    return Ok(new { message = "If an account with that email exists, a password reset link has been sent." });
                }

                // Generate reset token
                var resetToken = GenerateResetToken();
                var resetTokenExpiry = DateTime.UtcNow.AddHours(24); // Token expires in 24 hours

                user.PasswordResetToken = resetToken;
                user.PasswordResetTokenExpiry = resetTokenExpiry;

                await _context.SaveChangesAsync();

                // Send password reset email
                await SendPasswordResetEmail(user.Email, resetToken);

                return Ok(new { message = "If an account with that email exists, a password reset link has been sent." });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Forgot password error: {ex.Message}");
                return StatusCode(500, "An error occurred while processing your request");
            }
        }

        [HttpPost("reset-password")]
        public async Task<ActionResult> ResetPassword(ResetPasswordDto request)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.PasswordResetToken == request.Token);

                if (user == null || user.PasswordResetTokenExpiry < DateTime.UtcNow)
                {
                    return BadRequest("Invalid or expired reset token");
                }

                // Create new password hash
                _authService.CreatePasswordHash(request.NewPassword, out byte[] passwordHash, out byte[] passwordSalt);

                // Update user
                user.PasswordHash = passwordHash;
                user.PasswordSalt = passwordSalt;
                user.PasswordResetToken = null;
                user.PasswordResetTokenExpiry = null;
                user.FailedLoginAttempts = 0;
                user.IsAccountLocked = false;
                user.LockoutEnd = null;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Password has been reset successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Reset password error: {ex.Message}");
                return StatusCode(500, "An error occurred while resetting your password");
            }
        }

        [HttpPost("verify-email")]
        public async Task<ActionResult> VerifyEmail(VerifyEmailDto request)
        {
            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.EmailVerificationToken == request.Token);

                if (user == null)
                {
                    return BadRequest("Invalid verification token");
                }

                user.IsEmailVerified = true;
                user.EmailVerificationToken = null;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Email verified successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Email verification error: {ex.Message}");
                return StatusCode(500, "An error occurred during email verification");
            }
        }

        [HttpPost("resend-verification")]
        [Authorize]
        public async Task<ActionResult> ResendVerificationEmail()
        {
            try
            {
                var userId = GetCurrentUserId();
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return NotFound("User not found");
                }

                if (user.IsEmailVerified)
                {
                    return BadRequest("Email is already verified");
                }

                // Generate new verification token
                user.EmailVerificationToken = GenerateVerificationToken();
                await _context.SaveChangesAsync();

                // Send verification email
                await SendVerificationEmail(user.Email, user.EmailVerificationToken);

                return Ok(new { message = "Verification email sent" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Resend verification error: {ex.Message}");
                return StatusCode(500, "An error occurred while sending verification email");
            }
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<ActionResult> ChangePassword(ChangePasswordDto request)
        {
            try
            {
                var userId = GetCurrentUserId();
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return NotFound("User not found");
                }

                // Verify current password
                if (!_authService.VerifyPasswordHash(request.CurrentPassword, user.PasswordHash, user.PasswordSalt))
                {
                    return BadRequest("Current password is incorrect");
                }

                // Check if new password is different from current
                if (_authService.VerifyPasswordHash(request.NewPassword, user.PasswordHash, user.PasswordSalt))
                {
                    return BadRequest("New password must be different from current password");
                }

                // Create new password hash
                _authService.CreatePasswordHash(request.NewPassword, out byte[] passwordHash, out byte[] passwordSalt);

                // Update user
                user.PasswordHash = passwordHash;
                user.PasswordSalt = passwordSalt;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Password changed successfully" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Change password error: {ex.Message}");
                return StatusCode(500, "An error occurred while changing password");
            }
        }

        [HttpGet("current-user")]
        [Authorize]
        public async Task<ActionResult<CurrentUserDto>> GetCurrentUser()
        {
            try
            {
                var userId = GetCurrentUserId();
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return NotFound("User not found");
                }

                return Ok(new CurrentUserDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    IsEmailVerified = user.IsEmailVerified
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"GetCurrentUser error: {ex.Message}");
                return StatusCode(500, "An error occurred while getting current user");
            }
        }

        [HttpPost("refresh-token")]
        [Authorize]
        public async Task<ActionResult<AuthResponseDto>> RefreshToken()
        {
            try
            {
                var userId = GetCurrentUserId();
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return NotFound("User not found");
                }

                // Generate new JWT token
                var token = _authService.CreateToken(user);

                return Ok(new AuthResponseDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    Token = token
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Refresh token error: {ex.Message}");
                return StatusCode(500, "An error occurred while refreshing token");
            }
        }

        [HttpPost("validate-password")]
        public ActionResult<PasswordValidationDto> ValidatePassword(ValidatePasswordRequestDto request)
        {
            try
            {
                var validation = _authService.ValidatePassword(request.Password);
                return Ok(validation);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Password validation error: {ex.Message}");
                return StatusCode(500, "An error occurred during password validation");
            }
        }

        [HttpPost("check-availability")]
        public async Task<ActionResult<AvailabilityResponseDto>> CheckAvailability(CheckAvailabilityDto request)
        {
            try
            {
                var response = new AvailabilityResponseDto
                {
                    IsUsernameAvailable = true,
                    IsEmailAvailable = true
                };

                if (!string.IsNullOrEmpty(request.Username))
                {
                    var usernameExists = await _context.Users.AnyAsync(u => u.Username.ToLower() == request.Username.ToLower());
                    response.IsUsernameAvailable = !usernameExists;

                    if (!response.IsUsernameAvailable)
                    {
                        response.UsernameMessage = "Username is already taken";
                    }
                    else if (!_authService.IsValidUsername(request.Username))
                    {
                        response.IsUsernameAvailable = false;
                        response.UsernameMessage = "Username format is invalid";
                    }
                    else
                    {
                        response.UsernameMessage = "Username is available";
                    }
                }

                if (!string.IsNullOrEmpty(request.Email))
                {
                    var emailExists = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
                    response.IsEmailAvailable = !emailExists;

                    if (!response.IsEmailAvailable)
                    {
                        response.EmailMessage = "Email is already registered";
                    }
                    else if (!_authService.IsValidEmail(request.Email))
                    {
                        response.IsEmailAvailable = false;
                        response.EmailMessage = "Email format is invalid";
                    }
                    else
                    {
                        response.EmailMessage = "Email is available";
                    }
                }

                return Ok(response);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Check availability error: {ex.Message}");
                return StatusCode(500, "An error occurred while checking availability");
            }
        }

        [HttpGet("account-status")]
        [Authorize]
        public async Task<ActionResult<AccountStatusDto>> GetAccountStatus()
        {
            try
            {
                var userId = GetCurrentUserId();
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return NotFound("User not found");
                }

                return Ok(new AccountStatusDto
                {
                    IsActive = !user.IsAccountLocked,
                    IsEmailVerified = user.IsEmailVerified,
                    IsAccountLocked = user.IsAccountLocked,
                    LockoutEnd = user.LockoutEnd,
                    FailedLoginAttempts = user.FailedLoginAttempts,
                    CreatedAt = user.CreatedAt,
                    LastLoginAt = user.LastLoginAt,
                    RequiresPasswordChange = false 
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Get account status error: {ex.Message}");
                return StatusCode(500, "An error occurred while getting account status");
            }
        }

        // Helper methods
        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? User.FindFirst("nameid")?.Value
                ?? User.FindFirst("sub")?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                throw new UnauthorizedAccessException("Invalid token");
            }

            return userId;
        }

        private string GenerateResetToken()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[32];
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes).Replace("+", "").Replace("/", "").Replace("=", "");
        }

        private string GenerateVerificationToken()
        {
            return Guid.NewGuid().ToString();
        }

        private async Task HandleFailedLogin(User user)
        {
            user.FailedLoginAttempts++;

            if (user.FailedLoginAttempts >= 5)
            {
                user.IsAccountLocked = true;
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(30); // Lock for 30 minutes
            }

            await _context.SaveChangesAsync();
        }

        private async Task ResetFailedLoginAttempts(User user)
        {
            user.FailedLoginAttempts = 0;
            user.IsAccountLocked = false;
            user.LockoutEnd = null;
            await _context.SaveChangesAsync();
        }

        private async Task SendPasswordResetEmail(string email, string resetToken)
        {
            var frontendBaseUrl = "http://localhost:5173";
            var resetLink = $"{frontendBaseUrl}/reset-password?token={resetToken}";
            var subject = "Password Reset - Billaroo";
            var body = $@"
                <html>
                <body>
                    <h2>Password Reset Request</h2>
                    <p>We received a request to reset your password for your Billaroo account.</p>
                    <p>Click the link below to reset your password:</p>
                    <p><a href='{resetLink}'>Reset Password</a></p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't request this password reset, please ignore this email.</p>
                    <br/>
                    <p>Best regards,<br/>The Billaroo Team</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(email, subject, body);
        }

        private async Task SendVerificationEmail(string email, string verificationToken)
        {
            var frontendBaseUrl = "http://localhost:5173"; // Use frontend URL
            var verificationLink = $"{frontendBaseUrl}/verify-email?token={verificationToken}";
            var subject = "Email Verification - Billaroo";
            var body = $@"
                        <html>
                        <body>
                            <h2>Welcome to Billaroo!</h2>
                            <p>Thank you for creating your account. Please verify your email address by clicking the link below:</p>
                            <p><a href='{verificationLink}'>Verify Email Address</a></p>
                            <p>If you didn't create this account, please ignore this email.</p>
                            <br/>
                            <p>Best regards,<br/>The Billaroo Team</p>
                        </body>
                        </html>";

            await _emailService.SendEmailAsync(email, subject, body);
        }

        private async Task SendWelcomeEmail(User user)
        {
            var subject = "Welcome to Billaroo!";
            var body = $@"
                <html>
                <body>
                    <h2>Welcome to Billaroo, {user.Username}!</h2>
                    <p>Your account has been successfully created as a <strong>{user.Role}</strong>.</p>
                    <p>You can now start managing your {(user.Role == "freelancer" ? "clients and projects" : "freelance projects")}.</p>
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                    <br/>
                    <p>Best regards,<br/>The Billaroo Team</p>
                </body>
                </html>";

            await _emailService.SendEmailAsync(user.Email, subject, body);
        }
    }
}