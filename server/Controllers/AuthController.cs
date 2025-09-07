using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Services;
using Server.Services.Interfaces;
using System.ComponentModel.DataAnnotations;
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
        private readonly ISecurityAuditService _securityAuditService;

        public AuthController(AppDbContext context, IAuthService authService, IEmailService emailService, ISecurityAuditService securityAuditService)
        {
            _context = context;
            _authService = authService;
            _emailService = emailService;
            _securityAuditService = securityAuditService;
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
            string? ipAddress = GetClientIpAddress();
            string? userAgent = Request.Headers["User-Agent"].ToString();
            string? deviceInfo = GetDeviceInfo(userAgent);

            try
            {
                // Find user by username
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == request.Username);

                if (user == null)
                {
                    // Log failed login attempt (without revealing if user exists)
                    await LogLoginAttempt(0, request.Username, false, "Invalid credentials",
                        ipAddress, userAgent, deviceInfo);
                    return BadRequest("Invalid username or password");
                }

                // Check if account is locked
                if (user.IsAccountLocked && user.LockoutEnd > DateTime.UtcNow)
                {
                    var remainingTime = user.LockoutEnd.Value.Subtract(DateTime.UtcNow);
                    await LogLoginAttempt(user.Id, user.Username, false, "Account locked",
                        ipAddress, userAgent, deviceInfo);
                    return BadRequest($"Account is locked. Try again in {Math.Ceiling(remainingTime.TotalMinutes)} minutes.");
                }

                // Verify password
                if (!_authService.VerifyPasswordHash(request.Password, user.PasswordHash, user.PasswordSalt))
                {
                    await HandleFailedLogin(user);
                    await LogLoginAttempt(user.Id, user.Username, false, "Invalid password",
                        ipAddress, userAgent, deviceInfo);
                    return BadRequest("Invalid username or password");
                }

                // Reset failed login attempts and update last login on successful login
                user.FailedLoginAttempts = 0;
                user.IsAccountLocked = false;
                user.LockoutEnd = null;
                user.LastLoginAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Log successful login
                await LogLoginAttempt(user.Id, user.Username, true, null,
                    ipAddress, userAgent, deviceInfo);

                // Log security audit
                await _securityAuditService.LogAsync(user.Id, "login_success",
                    "User logged in successfully", ipAddress, userAgent);

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
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    LastLoginAt = user.LastLoginAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Login error: {ex.Message}");
                await LogLoginAttempt(0, request.Username, false, "System error",
                    ipAddress, userAgent, deviceInfo);
                return StatusCode(500, "An error occurred during login");
            }
        }

        [HttpPost("logout")]
        [Authorize]
        public async Task<ActionResult> Logout()
        {
            var userId = GetCurrentUserId();

            // Log the logout
            await _securityAuditService.LogAsync(userId, "logout",
                "User logged out", HttpContext);

            return Ok(new { message = "Logged out successfully" });
        }

        [HttpPost("login-with-2fa")]
        public async Task<ActionResult<AuthResponseDto>> LoginWithTwoFactor(LoginWith2FADto request)
        {
            string? ipAddress = GetClientIpAddress();
            string? userAgent = Request.Headers["User-Agent"].ToString();
            string? deviceInfo = GetDeviceInfo(userAgent);

            try
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Username == request.Username);

                if (user == null || !user.TwoFactorEnabled)
                {
                    return BadRequest("Invalid request");
                }

                // Verify password first
                if (!_authService.VerifyPasswordHash(request.Password, user.PasswordHash, user.PasswordSalt))
                {
                    await LogLoginAttempt(user.Id, user.Username, false, "Invalid password (2FA)",
                        ipAddress, userAgent, deviceInfo);
                    return BadRequest("Invalid credentials");
                }

                // Verify 2FA code
                else if (!string.IsNullOrEmpty(request.RecoveryCode))
                {
                    // Remove used recovery code
                    user.TwoFactorRecoveryCodes = user.TwoFactorRecoveryCodes?
                        .Where(code => code != request.RecoveryCode.ToLower())
                        .ToArray();
                }
                await LogLoginAttempt(user.Id, user.Username, false, "Invalid 2FA code",
                    ipAddress, userAgent, deviceInfo);
                return BadRequest("Invalid two-factor authentication code");
                
                // Update login info
                user.FailedLoginAttempts = 0;
                user.IsAccountLocked = false;
                user.LockoutEnd = null;
                user.LastLoginAt = DateTime.UtcNow;
                user.LastTwoFactorUsed = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Log successful 2FA login
                await LogLoginAttempt(user.Id, user.Username, true, null,
                    ipAddress, userAgent, deviceInfo, true);

                await _securityAuditService.LogAsync(user.Id, "2fa_login_success",
                    "User logged in with 2FA", ipAddress, userAgent);

                var token = _authService.CreateToken(user);

                return Ok(new AuthResponseDto
                {
                    Id = user.Id,
                    Username = user.Username,
                    Email = user.Email,
                    Role = user.Role,
                    Token = token,
                    IsEmailVerified = user.IsEmailVerified,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    LastLoginAt = user.LastLoginAt
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"2FA Login error: {ex.Message}");
                return StatusCode(500, "An error occurred during login");
            }
        }

        [HttpGet("login-history")]
        [Authorize]
        public async Task<ActionResult<List<LoginHistoryDto>>> GetLoginHistory(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 20)
        {
            var userId = GetCurrentUserId();
            var skip = (page - 1) * pageSize;

            var history = await _context.LoginHistories
                .Where(lh => lh.UserId == userId)
                .OrderByDescending(lh => lh.LoginTime)
                .Skip(skip)
                .Take(pageSize)
                .Select(lh => new LoginHistoryDto
                {
                    LoginTime = lh.LoginTime,
                    IpAddress = lh.IpAddress,
                    DeviceInfo = lh.DeviceInfo,
                    Location = lh.Location,
                    IsSuccessful = lh.IsSuccessful,
                    IsTwoFactorUsed = lh.IsTwoFactorUsed
                })
                .ToListAsync();

            return Ok(history);
        }

        [HttpPost("forgot-password")]
        public async Task<ActionResult> ForgotPassword(ForgotPasswordDto request)
        {
            try
            {
                var user = await _context.Users
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(u => u.Email == request.Email);

                if (user == null)
                {
                    return Ok(new { message = "If an account with that email exists, a password reset link has been sent." });
                }

                var resetToken = GenerateResetToken();
                var resetTokenExpiry = DateTime.UtcNow.AddHours(24);

                user.PasswordResetToken = resetToken;
                user.PasswordResetTokenExpiry = resetTokenExpiry;

                await _context.SaveChangesAsync();

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
        public async Task<ActionResult> ResetPassword([FromBody] ResetPasswordDto request)
        {
            try
            {
                var user = await _context.Users
                    .IgnoreQueryFilters()  // This bypasses global filters
                    .FirstOrDefaultAsync(u => u.PasswordResetToken == request.Token);

                if (user == null || user.PasswordResetTokenExpiry < DateTime.UtcNow)
                {
                    return BadRequest("Invalid or expired reset token");
                }

                _authService.CreatePasswordHash(request.NewPassword, out byte[] passwordHash, out byte[] passwordSalt);

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
        private async Task LogLoginAttempt(int userId, string username, bool isSuccessful,
    string? failureReason = null, string? ipAddress = null, string? userAgent = null,
    string? deviceInfo = null, bool isTwoFactorUsed = false)
        {
            try
            {
                var loginHistory = new LoginHistory
                {
                    UserId = userId,
                    LoginTime = DateTime.UtcNow,
                    IpAddress = ipAddress,
                    UserAgent = userAgent,
                    DeviceInfo = deviceInfo,
                    Location = await GetLocationFromIp(ipAddress), // Implement this method
                    IsSuccessful = isSuccessful,
                    FailureReason = failureReason,
                    IsTwoFactorUsed = isTwoFactorUsed
                };

                _context.LoginHistories.Add(loginHistory);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to log login attempt: {ex.Message}");
            }
        }

        private string? GetClientIpAddress()
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString() ??
                   Request.Headers["X-Forwarded-For"].FirstOrDefault() ??
                   Request.Headers["X-Real-IP"].FirstOrDefault();
        }

        private static string GetDeviceInfo(string? userAgent)
        {
            if (string.IsNullOrEmpty(userAgent))
                return "Unknown";

            // Basic device detection (you can enhance this with a library like UAParser)
            if (userAgent.Contains("Mobile"))
                return "Mobile Device";
            if (userAgent.Contains("Tablet"))
                return "Tablet";
            if (userAgent.Contains("Windows"))
                return "Windows PC";
            if (userAgent.Contains("Mac"))
                return "Mac";
            if (userAgent.Contains("Linux"))
                return "Linux PC";

            return "Desktop";
        }

        private async Task<string?> GetLocationFromIp(string? ipAddress)
        {
            // Implement IP-to-location service integration
            // - MaxMind GeoLite2
            // - IPinfo.io
            // - IP-API.com

            if (string.IsNullOrEmpty(ipAddress))
                return null;

            // For now, return null (implement based on your chosen service)
            return null;
        }

        // Additional DTO for 2FA login
        public class LoginWith2FADto
        {
            [Required]
            public required string Username { get; set; }

            [Required]
            public required string Password { get; set; }

            public string? TwoFactorCode { get; set; }
            public string? RecoveryCode { get; set; }
        }
    }
}
