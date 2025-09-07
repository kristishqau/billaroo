using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Services.Interfaces;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController(
        AppDbContext context,
        ISmsService smsService,
        IFileUploadService fileUploadService,
        ITwoFactorService twoFactorService,
        ISecurityAuditService securityAuditService) : ControllerBase
    {
        private readonly AppDbContext _context = context;
        private readonly ISmsService _smsService = smsService;
        private readonly IFileUploadService _fileUploadService = fileUploadService;
        private readonly ITwoFactorService _twoFactorService = twoFactorService;
        private readonly ISecurityAuditService _securityAuditService = securityAuditService;
        private static readonly string[] sourceArray = ["FirstName", "LastName", "Bio"];

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private string GetUserRole() =>
            User.FindFirstValue(ClaimTypes.Role)!;

        #region Client Management (for Freelancers)

        [HttpGet("clients")]
        [Authorize(Roles = "freelancer")]
        public async Task<ActionResult<List<UserDto>>> GetMyClients()
        {
            var userId = GetUserId();

            // Get all users with client role
            // Note: You may want to add business logic to filter clients by relationship to freelancer
            var clients = await _context.Users
                .Where(u => u.Role == "client")
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Company = u.Company,
                    Role = u.Role
                })
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .ToListAsync();

            return Ok(clients);
        }

        [HttpGet("clients/{id}")]
        [Authorize(Roles = "freelancer")]
        public async Task<ActionResult<UserDetailDto>> GetClientDetail(int id)
        {
            var userId = GetUserId();

            var client = await _context.Users
                .Where(u => u.Id == id && u.Role == "client")
                .Select(u => new UserDetailDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Company = u.Company,
                    Role = u.Role,
                    ProjectCount = _context.Projects.Count(p => p.ClientId == u.Id),
                    TotalInvoiceAmount = _context.Invoices
                        .Where(i => i.ClientId == u.Id)
                        .Sum(i => (decimal?)i.Amount) ?? 0,
                    PaidInvoiceAmount = _context.Invoices
                        .Where(i => i.ClientId == u.Id && i.Status == InvoiceStatus.Paid)
                        .Sum(i => (decimal?)i.Amount) ?? 0,
                    LastActivity = u.LastLoginAt,
                    IsActive = u.LastLoginAt.HasValue && u.LastLoginAt.Value > DateTime.UtcNow.AddDays(-30)
                })
                .FirstOrDefaultAsync();

            if (client == null)
                return NotFound("Client not found.");

            return Ok(client);
        }

        [HttpGet("clients/{id}/projects")]
        [Authorize(Roles = "freelancer")]
        public async Task<ActionResult<List<ProjectDto>>> GetClientProjects(int id)
        {
            // Verify client exists and is actually a client
            var clientExists = await _context.Users
                .AnyAsync(u => u.Id == id && u.Role == "client");

            if (!clientExists)
                return NotFound("Client not found.");

            var projects = await _context.Projects
                .Where(p => p.ClientId == id)
                .Select(p => new ProjectDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    Deadline = p.Deadline,
                    ClientId = p.ClientId
                })
                .OrderBy(p => p.Deadline)
                .ToListAsync();

            return Ok(projects);
        }

        [HttpGet("clients/{id}/invoices")]
        [Authorize(Roles = "freelancer")]
        public async Task<ActionResult<List<InvoiceDto>>> GetClientInvoices(int id)
        {
            var userId = GetUserId();

            // Verify client exists and is actually a client
            var clientExists = await _context.Users
                .AnyAsync(u => u.Id == id && u.Role == "client");

            if (!clientExists)
                return NotFound("Client not found.");

            var invoices = await _context.Invoices
                .Include(i => i.Items)
                .Include(i => i.Project)
                .Include(i => i.Payments)
                .Where(i => i.ClientId == id && i.FreelancerId == userId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return Ok(invoices.Select(MapToInvoiceDto).ToList());
        }

        [HttpGet("clients/search")]
        [Authorize(Roles = "freelancer")]
        public async Task<ActionResult<List<UserDto>>> SearchClients([FromQuery] string searchTerm)
        {
            if (string.IsNullOrWhiteSpace(searchTerm))
                return await GetMyClients();

            var clients = await _context.Users
                .Where(u => u.Role == "client" &&
                           (u.FirstName!.Contains(searchTerm) ||
                            u.LastName!.Contains(searchTerm) ||
                            u.Email.Contains(searchTerm) ||
                            u.Company!.Contains(searchTerm) ||
                            u.Username.Contains(searchTerm)))
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    Email = u.Email,
                    FirstName = u.FirstName,
                    LastName = u.LastName,
                    Company = u.Company,
                    Role = u.Role
                })
                .OrderBy(u => u.FirstName)
                .ThenBy(u => u.LastName)
                .ToListAsync();

            return Ok(clients);
        }

        [HttpGet("clients/stats")]
        [Authorize(Roles = "freelancer")]
        public async Task<ActionResult<ClientStatsDto>> GetClientStats()
        {
            var userId = GetUserId();

            var totalClients = await _context.Users.CountAsync(u => u.Role == "client");

            var clientsWithProjects = await _context.Users
                .Where(u => u.Role == "client")
                .CountAsync(u => _context.Projects.Any(p => p.ClientId == u.Id));

            var clientsWithUnpaidInvoices = await _context.Users
                .Where(u => u.Role == "client")
                .CountAsync(u => _context.Invoices.Any(i => i.ClientId == u.Id &&
                                                           (i.Status == InvoiceStatus.Sent || i.Status == InvoiceStatus.Overdue)));

            var topClientsByRevenue = await _context.Users
                .Where(u => u.Role == "client")
                .Select(u => new
                {
                    ClientName = !string.IsNullOrEmpty(u.FirstName) && !string.IsNullOrEmpty(u.LastName)
                        ? u.FirstName + " " + u.LastName
                        : u.Username,
                    TotalRevenue = _context.Invoices
                        .Where(i => i.ClientId == u.Id && i.Status == InvoiceStatus.Paid)
                        .Sum(i => (decimal?)i.Amount) ?? 0
                })
                .Where(x => x.TotalRevenue > 0)
                .OrderByDescending(x => x.TotalRevenue)
                .Take(5)
                .ToListAsync();

            var firstDayOfMonth = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
            var activeClientsThisMonth = await _context.Users
                .Where(u => u.Role == "client")
                .CountAsync(u => u.LastLoginAt.HasValue && u.LastLoginAt.Value >= firstDayOfMonth);

            var newClientsThisMonth = await _context.Users
                .Where(u => u.Role == "client" && u.CreatedAt >= firstDayOfMonth)
                .CountAsync();

            return Ok(new ClientStatsDto
            {
                TotalClients = totalClients,
                ClientsWithProjects = clientsWithProjects,
                ClientsWithUnpaidInvoices = clientsWithUnpaidInvoices,
                TopClientsByRevenue = topClientsByRevenue,
                ActiveClientsThisMonth = activeClientsThisMonth,
                NewClientsThisMonth = newClientsThisMonth
            });
        }

        #endregion

        #region Profile Management

        [HttpGet("profile")]
        public async Task<ActionResult<UserProfileDto>> GetProfile()
        {
            var userId = GetUserId();
            var user = await _context.Users
                .Include(u => u.Skills)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("User not found.");

            return Ok(new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role,
                FirstName = user.FirstName,
                LastName = user.LastName,
                ProfileImageUrl = user.ProfileImageUrl,
                PhoneNumber = user.PhoneNumber,
                TimeZone = user.TimeZone,
                JobTitle = user.JobTitle,
                Company = user.Company,
                Bio = user.Bio,
                Website = user.Website,
                LinkedInUrl = user.LinkedInUrl,
                GitHubUrl = user.GitHubUrl,
                TwitterUrl = user.TwitterUrl,
                PortfolioUrl = user.PortfolioUrl,
                CvUrl = user.CvUrl,
                CvUploadedAt = user.CvUploadedAt,
                Street = user.Street,
                City = user.City,
                State = user.State,
                PostalCode = user.PostalCode,
                Country = user.Country,
                IsEmailVerified = user.IsEmailVerified,
                IsPhoneVerified = user.IsPhoneVerified,
                IsIdentityVerified = user.IsIdentityVerified,
                IsProfileComplete = user.IsProfileComplete,
                VerificationStatus = user.VerificationStatus,
                ShowEmail = user.ShowEmail,
                ShowPhone = user.ShowPhone,
                ShowAddress = user.ShowAddress,
                AllowMessages = user.AllowMessages,
                EmailNotifications = user.EmailNotifications,
                SmsNotifications = user.SmsNotifications,
                MarketingEmails = user.MarketingEmails,
                TwoFactorEnabled = user.TwoFactorEnabled,
                CreatedAt = user.CreatedAt,
                LastLoginAt = user.LastLoginAt,
                Skills = user.Skills?.Select(s => new UserSkillDto
                {
                    Id = s.Id,
                    SkillName = s.SkillName,
                    ProficiencyLevel = s.ProficiencyLevel,
                    IsVerified = s.IsVerified,
                    CreatedAt = s.CreatedAt
                }).ToList()
            });
        }

        [HttpPut("profile")]
        public async Task<ActionResult<UserProfileDto>> UpdateProfile(UpdateProfileDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            var oldEmail = user.Email;
            var oldPhone = user.PhoneNumber;

            // Check for duplicate username
            if (!string.IsNullOrEmpty(dto.Username) && dto.Username != user.Username)
            {
                var existingUser = await _context.Users
                    .AnyAsync(u => u.Username == dto.Username && u.Id != userId);

                if (existingUser)
                    return BadRequest("Username is already taken.");

                user.Username = dto.Username;
            }

            // Check for duplicate email
            if (!string.IsNullOrEmpty(dto.Email) && dto.Email != user.Email)
            {
                var existingUser = await _context.Users
                    .AnyAsync(u => u.Email == dto.Email && u.Id != userId);

                if (existingUser)
                    return BadRequest("Email is already taken.");

                user.Email = dto.Email;
                user.IsEmailVerified = false; // Reset email verification
            }

            // Update phone and reset verification if changed
            if (!string.IsNullOrEmpty(dto.PhoneNumber) && dto.PhoneNumber != user.PhoneNumber)
            {
                user.PhoneNumber = dto.PhoneNumber;
                user.IsPhoneVerified = false; // Reset phone verification
            }

            // Update other fields
            if (dto.FirstName != null) user.FirstName = dto.FirstName;
            if (dto.LastName != null) user.LastName = dto.LastName;
            if (dto.JobTitle != null) user.JobTitle = dto.JobTitle;
            if (dto.Company != null) user.Company = dto.Company;
            if (dto.Bio != null) user.Bio = dto.Bio;
            if (dto.Website != null) user.Website = dto.Website;
            if (dto.LinkedInUrl != null) user.LinkedInUrl = dto.LinkedInUrl;
            if (dto.GitHubUrl != null) user.GitHubUrl = dto.GitHubUrl;
            if (dto.TwitterUrl != null) user.TwitterUrl = dto.TwitterUrl;
            if (dto.PortfolioUrl != null) user.PortfolioUrl = dto.PortfolioUrl;
            if (dto.Street != null) user.Street = dto.Street;
            if (dto.City != null) user.City = dto.City;
            if (dto.State != null) user.State = dto.State;
            if (dto.PostalCode != null) user.PostalCode = dto.PostalCode;
            if (dto.Country != null) user.Country = dto.Country;
            if (dto.TimeZone != null) user.TimeZone = dto.TimeZone;

            // Privacy settings
            if (dto.ShowEmail.HasValue) user.ShowEmail = dto.ShowEmail.Value;
            if (dto.ShowPhone.HasValue) user.ShowPhone = dto.ShowPhone.Value;
            if (dto.ShowAddress.HasValue) user.ShowAddress = dto.ShowAddress.Value;
            if (dto.AllowMessages.HasValue) user.AllowMessages = dto.AllowMessages.Value;

            // Preferences
            if (dto.EmailNotifications.HasValue) user.EmailNotifications = dto.EmailNotifications.Value;
            if (dto.SmsNotifications.HasValue) user.SmsNotifications = dto.SmsNotifications.Value;
            if (dto.MarketingEmails.HasValue) user.MarketingEmails = dto.MarketingEmails.Value;

            user.UpdatedAt = DateTime.UtcNow;
            user.IsProfileComplete = CheckProfileCompletion(user);

            await _context.SaveChangesAsync();

            // Log security audit for sensitive changes
            if (oldEmail != user.Email || oldPhone != user.PhoneNumber)
            {
                await _securityAuditService.LogAsync(userId,
                    oldEmail != user.Email ? "email_change" : "phone_change",
                    $"Changed from {(oldEmail != user.Email ? oldEmail : oldPhone)} to {(oldEmail != user.Email ? user.Email : user.PhoneNumber)}",
                    HttpContext);
            }

            return await GetProfile();
        }

        #endregion

        #region Phone Verification

        [HttpPost("send-phone-verification")]
        public async Task<ActionResult> SendPhoneVerification(SendPhoneVerificationDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            if (user.IsPhoneVerified && user.PhoneNumber == dto.PhoneNumber)
                return BadRequest("Phone number is already verified.");

            // Generate 6-digit verification code
            var verificationCode = new Random().Next(100000, 999999).ToString();

            user.PhoneNumber = dto.PhoneNumber;
            user.PhoneVerificationCode = verificationCode;
            user.PhoneVerificationExpiry = DateTime.UtcNow.AddMinutes(10);
            user.IsPhoneVerified = false;

            await _context.SaveChangesAsync();

            // Send SMS
            await _smsService.SendSmsAsync(dto.PhoneNumber,
                $"Your Billaroo verification code is: {verificationCode}");

            await _securityAuditService.LogAsync(userId, "phone_verification_sent",
                $"Verification code sent to {dto.PhoneNumber}", HttpContext);

            return Ok(new { message = "Verification code sent to your phone number." });
        }

        [HttpPost("verify-phone")]
        public async Task<ActionResult> VerifyPhone(VerifyPhoneDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            if (string.IsNullOrEmpty(user.PhoneVerificationCode) || user.PhoneVerificationExpiry < DateTime.UtcNow)
                return BadRequest("Verification code has expired. Please request a new one.");

            if (user.PhoneVerificationCode != dto.VerificationCode)
                return BadRequest("Invalid verification code.");

            user.IsPhoneVerified = true;
            user.PhoneVerificationCode = null;
            user.PhoneVerificationExpiry = null;
            user.IsProfileComplete = CheckProfileCompletion(user);

            await _context.SaveChangesAsync();

            await _securityAuditService.LogAsync(userId, "phone_verified",
                $"Phone number {user.PhoneNumber} verified successfully", HttpContext);

            return Ok(new { message = "Phone number verified successfully." });
        }

        #endregion

        #region Two-Factor Authentication

        [HttpPost("enable-2fa")]
        public async Task<ActionResult> EnableTwoFactor(EnableTwoFactorDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            if (!VerifyPassword(dto.Password, user.PasswordHash, user.PasswordSalt))
                return BadRequest("Password is incorrect.");

            if (user.TwoFactorEnabled)
                return BadRequest("Two-factor authentication is already enabled.");

            var secret = _twoFactorService.GenerateSecret();
            var qrCodeUrl = _twoFactorService.GenerateQrCodeUrl(user.Email, secret);

            user.TwoFactorSecret = secret;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                secret,
                qrCodeUrl,
                message = "Scan the QR code with your authenticator app and confirm with a code."
            });
        }

        [HttpPost("confirm-2fa")]
        public async Task<ActionResult> ConfirmTwoFactor(ConfirmTwoFactorDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            if (string.IsNullOrEmpty(user.TwoFactorSecret))
                return BadRequest("Two-factor setup not initiated.");

            if (!_twoFactorService.ValidateCode(user.TwoFactorSecret, dto.Code))
                return BadRequest("Invalid verification code.");

            user.TwoFactorEnabled = true;
            user.TwoFactorRecoveryCodes = _twoFactorService.GenerateRecoveryCodes();

            await _context.SaveChangesAsync();

            await _securityAuditService.LogAsync(userId, "2fa_enabled",
                "Two-factor authentication enabled", HttpContext);

            return Ok(new
            {
                recoveryCodes = user.TwoFactorRecoveryCodes,
                message = "Two-factor authentication enabled successfully. Save your recovery codes in a safe place."
            });
        }

        [HttpPost("disable-2fa")]
        public async Task<ActionResult> DisableTwoFactor(DisableTwoFactorDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            if (!user.TwoFactorEnabled)
                return BadRequest("Two-factor authentication is not enabled.");

            if (!VerifyPassword(dto.Password, user.PasswordHash, user.PasswordSalt))
                return BadRequest("Password is incorrect.");

            if (!_twoFactorService.ValidateCode(user.TwoFactorSecret!, dto.TwoFactorCode))
                return BadRequest("Invalid two-factor code.");

            user.TwoFactorEnabled = false;
            user.TwoFactorSecret = null;
            user.TwoFactorRecoveryCodes = null;

            await _context.SaveChangesAsync();

            await _securityAuditService.LogAsync(userId, "2fa_disabled",
                "Two-factor authentication disabled", HttpContext);

            return Ok(new { message = "Two-factor authentication disabled successfully." });
        }

        #endregion

        #region File Uploads

        [HttpPost("upload-profile-image")]
        public async Task<ActionResult> UploadProfileImage(IFormFile file)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            if (file == null || file.Length == 0)
                return BadRequest("No file was provided.");

            try
            {
                // Upload the file using the injected service
                var fileUrl = await _fileUploadService.UploadFileAsync(file, $"profile-images/{userId}");
                user.ProfileImageUrl = fileUrl;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                await _securityAuditService.LogAsync(userId, "profile_image_uploaded",
                    "User profile image uploaded", HttpContext);

                return Ok(new { message = "Profile image uploaded successfully.", fileUrl });
            }
            catch (Exception ex)
            {
                await _securityAuditService.LogAsync(userId, "profile_image_upload_failed",
                    $"Profile image upload failed: {ex.Message}", HttpContext);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("upload-cv")]
        public async Task<ActionResult> UploadCv(IFormFile cvFile)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            if (cvFile == null || cvFile.Length == 0)
                return BadRequest("No file was provided.");

            try
            {
                var fileUrl = await _fileUploadService.UploadFileAsync(cvFile, $"user-cvs/{userId}");
                user.CvUrl = fileUrl;
                user.CvUploadedAt = DateTime.UtcNow;
                user.UpdatedAt = DateTime.UtcNow;
                user.IsProfileComplete = CheckProfileCompletion(user);

                await _context.SaveChangesAsync();
                await _securityAuditService.LogAsync(userId, "cv_uploaded",
                    "User CV uploaded", HttpContext);

                return Ok(new { message = "CV uploaded successfully.", fileUrl });
            }
            catch (Exception ex)
            {
                await _securityAuditService.LogAsync(userId, "cv_upload_failed",
                    $"CV upload failed: {ex.Message}", HttpContext);
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPost("upload-verification-document")]
        public async Task<ActionResult> UploadVerificationDocument([FromForm] UploadVerificationDocumentDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            var allowedTypes = new[] { "image/jpeg", "image/png", "application/pdf" };
            if (!allowedTypes.Contains(dto.Document.ContentType))
                return BadRequest("Only JPEG, PNG, and PDF files are allowed.");

            if (dto.Document.Length > 10 * 1024 * 1024) // 10MB limit
                return BadRequest("File size cannot exceed 10MB.");

            try
            {
                var documentUrl = await _fileUploadService.UploadFileAsync(dto.Document, "verification-documents");

                user.VerificationDocumentUrl = documentUrl;
                user.VerificationStatus = "Pending";
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                await _securityAuditService.LogAsync(userId, "verification_document_uploaded",
                    $"Identity verification document uploaded: {dto.DocumentType}", HttpContext);

                return Ok(new { message = "Verification document uploaded successfully. It will be reviewed within 24-48 hours." });
            }
            catch (Exception)
            {
                return StatusCode(500, "Failed to upload verification document.");
            }
        }

        #endregion

        #region Skills Management

        [HttpPost("skills")]
        public async Task<ActionResult> AddSkill(AddSkillDto dto)
        {
            var userId = GetUserId();

            var existingSkill = await _context.UserSkills
                .FirstOrDefaultAsync(s => s.UserId == userId && s.SkillName.Equals(dto.SkillName, StringComparison.CurrentCultureIgnoreCase));

            if (existingSkill != null)
                return BadRequest("Skill already exists.");

            var skill = new UserSkill
            {
                UserId = userId,
                SkillName = dto.SkillName,
                ProficiencyLevel = dto.ProficiencyLevel,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserSkills.Add(skill);
            await _context.SaveChangesAsync();

            return Ok(new UserSkillDto
            {
                Id = skill.Id,
                SkillName = skill.SkillName,
                ProficiencyLevel = skill.ProficiencyLevel,
                IsVerified = skill.IsVerified,
                CreatedAt = skill.CreatedAt
            });
        }

        [HttpPut("skills/{skillId}")]
        public async Task<ActionResult> UpdateSkill(int skillId, AddSkillDto dto)
        {
            var userId = GetUserId();
            var skill = await _context.UserSkills
                .FirstOrDefaultAsync(s => s.Id == skillId && s.UserId == userId);

            if (skill == null)
                return NotFound("Skill not found.");

            skill.SkillName = dto.SkillName;
            skill.ProficiencyLevel = dto.ProficiencyLevel;

            await _context.SaveChangesAsync();

            return Ok(new UserSkillDto
            {
                Id = skill.Id,
                SkillName = skill.SkillName,
                ProficiencyLevel = skill.ProficiencyLevel,
                IsVerified = skill.IsVerified,
                CreatedAt = skill.CreatedAt
            });
        }

        [HttpDelete("skills/{skillId}")]
        public async Task<ActionResult> DeleteSkill(int skillId)
        {
            var userId = GetUserId();
            var skill = await _context.UserSkills
                .FirstOrDefaultAsync(s => s.Id == skillId && s.UserId == userId);

            if (skill == null)
                return NotFound("Skill not found.");

            _context.UserSkills.Remove(skill);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Skill deleted successfully." });
        }

        #endregion

        #region Security & Privacy

        [HttpGet("security-settings")]
        public async Task<ActionResult<SecuritySettingsDto>> GetSecuritySettings()
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            var recentLogins = await _context.LoginHistories
                .Where(l => l.UserId == userId)
                .OrderByDescending(l => l.LoginTime)
                .Take(10)
                .Select(l => new LoginHistoryDto
                {
                    LoginTime = l.LoginTime,
                    IpAddress = l.IpAddress,
                    DeviceInfo = l.DeviceInfo,
                    Location = l.Location,
                    IsSuccessful = l.IsSuccessful,
                    IsTwoFactorUsed = l.IsTwoFactorUsed
                })
                .ToListAsync();

            return Ok(new SecuritySettingsDto
            {
                TwoFactorEnabled = user.TwoFactorEnabled,
                IsPhoneVerified = user.IsPhoneVerified,
                IsEmailVerified = user.IsEmailVerified,
                IsIdentityVerified = user.IsIdentityVerified,
                LastPasswordChange = user.UpdatedAt,
                RecentLogins = recentLogins
            });
        }

        [HttpPut("privacy-settings")]
        public async Task<ActionResult> UpdatePrivacySettings(UpdatePrivacySettingsDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            user.ShowEmail = dto.ShowEmail;
            user.ShowPhone = dto.ShowPhone;
            user.ShowAddress = dto.ShowAddress;
            user.AllowMessages = dto.AllowMessages;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _securityAuditService.LogAsync(userId, "privacy_settings_updated",
                "Privacy settings updated", HttpContext);

            return Ok(new { message = "Privacy settings updated successfully." });
        }

        [HttpGet("profile-completion")]
        public async Task<ActionResult<ProfileCompletionDto>> GetProfileCompletion()
        {
            var userId = GetUserId();
            var user = await _context.Users
                .Include(u => u.Skills)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
                return NotFound("User not found.");

            var completion = new ProfileCompletionDto();
            var missingFields = new List<string>();

            // Basic Info Check
            completion.HasBasicInfo = !string.IsNullOrEmpty(user.FirstName) &&
                                     !string.IsNullOrEmpty(user.LastName) &&
                                     !string.IsNullOrEmpty(user.Bio);
            if (!completion.HasBasicInfo)
                missingFields.AddRange(sourceArray.Where(f =>
                    string.IsNullOrEmpty(typeof(User).GetProperty(f)?.GetValue(user)?.ToString())));

            // Contact Info Check
            completion.HasContactInfo = user.IsEmailVerified &&
                                       user.IsPhoneVerified &&
                                       !string.IsNullOrEmpty(user.City);
            if (!completion.HasContactInfo)
            {
                if (!user.IsEmailVerified) missingFields.Add("EmailVerification");
                if (!user.IsPhoneVerified) missingFields.Add("PhoneVerification");
                if (string.IsNullOrEmpty(user.City)) missingFields.Add("City");
            }

            // Professional Info Check
            completion.HasProfessionalInfo = !string.IsNullOrEmpty(user.JobTitle) &&
                                           (!string.IsNullOrEmpty(user.Website) || !string.IsNullOrEmpty(user.LinkedInUrl));
            if (!completion.HasProfessionalInfo)
            {
                if (string.IsNullOrEmpty(user.JobTitle)) missingFields.Add("JobTitle");
                if (string.IsNullOrEmpty(user.Website) && string.IsNullOrEmpty(user.LinkedInUrl))
                    missingFields.Add("Website or LinkedIn");
            }

            // Skills Check
            completion.HasSkills = user.Skills != null && user.Skills.Count >= 3;
            if (!completion.HasSkills)
                missingFields.Add("At least 3 skills");

            // Verification Check
            completion.HasVerification = user.IsIdentityVerified || !string.IsNullOrEmpty(user.CvUrl);
            if (!completion.HasVerification)
                missingFields.Add("Identity verification or CV upload");

            // Calculate completion percentage
            int completedSections = new[] { completion.HasBasicInfo, completion.HasContactInfo,
                                          completion.HasProfessionalInfo, completion.HasSkills,
                                          completion.HasVerification }.Count(x => x);
            completion.CompletionPercentage = (completedSections * 100) / 5;
            completion.MissingFields = missingFields;

            return Ok(completion);
        }

        #endregion

        #region Enhanced Account Management

        [HttpGet("account-summary")]
        [Authorize(Roles = "freelancer")]
        public async Task<ActionResult<AccountSummaryDto>> GetAccountSummary()
        {
            var userId = GetUserId();

            var clientCount = await _context.Users.CountAsync(u => u.Role == "client");
            var projectCount = await _context.Projects
                .Include(p => p.Client)
                .CountAsync(p => p.Client!.Role == "client");
            var invoiceCount = await _context.Invoices.CountAsync(i => i.FreelancerId == userId);
            var totalRevenue = await _context.Invoices
                .Where(i => i.FreelancerId == userId && i.Status == InvoiceStatus.Paid)
                .SumAsync(i => (decimal?)i.Amount) ?? 0;
            var pendingRevenue = await _context.Invoices
                .Where(i => i.FreelancerId == userId && i.Status == InvoiceStatus.Sent)
                .SumAsync(i => (decimal?)i.Amount) ?? 0;

            var hasUnpaidInvoices = await _context.Invoices
                .AnyAsync(i => i.FreelancerId == userId &&
                          (i.Status == InvoiceStatus.Sent || i.Status == InvoiceStatus.Overdue));

            var hasActiveProjects = await _context.Projects
                .Include(p => p.Client)
                .AnyAsync(p => p.Client!.Role == "client" && p.Deadline > DateTimeOffset.UtcNow);

            // Get profile completion and security status
            var user = await _context.Users
                .Include(u => u.Skills)
                .FirstOrDefaultAsync(u => u.Id == userId);

            var profileCompletion = new ProfileCompletionDto();
            // Calculate profile completion (simplified)
            int completedItems = 0;
            int totalItems = 10;

            if (!string.IsNullOrEmpty(user.FirstName)) completedItems++;
            if (!string.IsNullOrEmpty(user.LastName)) completedItems++;
            if (!string.IsNullOrEmpty(user.Bio)) completedItems++;
            if (user.IsEmailVerified) completedItems++;
            if (user.IsPhoneVerified) completedItems++;
            if (!string.IsNullOrEmpty(user.JobTitle)) completedItems++;
            if (user.Skills?.Count >= 3) completedItems++;
            if (!string.IsNullOrEmpty(user.CvUrl)) completedItems++;
            if (!string.IsNullOrEmpty(user.ProfileImageUrl)) completedItems++;
            if (user.IsIdentityVerified) completedItems++;

            profileCompletion.CompletionPercentage = (completedItems * 100) / totalItems;

            var securityStatus = new SecuritySettingsDto
            {
                TwoFactorEnabled = user.TwoFactorEnabled,
                IsPhoneVerified = user.IsPhoneVerified,
                IsEmailVerified = user.IsEmailVerified,
                IsIdentityVerified = user.IsIdentityVerified
            };

            var nowUtc = DateTime.UtcNow;
            var firstDayOfMonth = new DateTimeOffset(nowUtc.Year, nowUtc.Month, 1, 0, 0, 0, TimeSpan.Zero);

            return Ok(new AccountSummaryDto
            {
                ClientCount = clientCount,
                ProjectCount = projectCount,
                InvoiceCount = invoiceCount,
                TotalRevenue = totalRevenue,
                PendingRevenue = pendingRevenue,
                HasUnpaidInvoices = hasUnpaidInvoices,
                HasActiveProjects = hasActiveProjects,
                CanDeleteAccount = !hasUnpaidInvoices,
                LastActivity = user.LastLoginAt ?? user.CreatedAt,
                TotalClients = clientCount,
                ActiveProjects = await _context.Projects
                    .Include(p => p.Client)
                    .CountAsync(p => p.Client!.Role == "client" && p.Deadline > DateTimeOffset.UtcNow),
                ThisMonthRevenue = await _context.Invoices
                    .Where(i => i.FreelancerId == userId && i.PaidAt.HasValue && i.PaidAt.Value >= firstDayOfMonth)
                    .SumAsync(i => (decimal?)i.Amount) ?? 0,
                ProfileCompletion = profileCompletion,
                SecurityStatus = securityStatus,
                UnreadNotifications = 0, // Implement notification system
                HasPendingVerifications = user.VerificationStatus == "Pending"
            });
        }

        #endregion

        #region Helper Methods

        private bool CheckProfileCompletion(User user)
        {
            return !string.IsNullOrEmpty(user.FirstName) &&
                   !string.IsNullOrEmpty(user.LastName) &&
                   !string.IsNullOrEmpty(user.Bio) &&
                   user.IsEmailVerified &&
                   user.IsPhoneVerified &&
                   !string.IsNullOrEmpty(user.JobTitle);
        }

        private static void CreatePasswordHash(string password, out byte[] passwordHash, out byte[] passwordSalt)
        {
            using var hmac = new HMACSHA512();
            passwordSalt = hmac.Key;
            passwordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
        }

        private static bool VerifyPassword(string password, byte[] passwordHash, byte[] passwordSalt)
        {
            using var hmac = new HMACSHA512(passwordSalt);
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(password));
            return computedHash.SequenceEqual(passwordHash);
        }

        // Helper method for invoice mapping
        private static InvoiceDto MapToInvoiceDto(Invoice invoice)
        {
            return new InvoiceDto
            {
                Id = invoice.Id,
                InvoiceNumber = invoice.InvoiceNumber,
                Title = invoice.Title,
                Description = invoice.Description,
                Amount = invoice.Amount,
                IssueDate = invoice.IssueDate,
                DueDate = invoice.DueDate,
                Status = invoice.Status.ToString(),
                ProjectId = invoice.ProjectId,
                ProjectTitle = invoice.Project?.Title ?? "N/A",
                ClientId = invoice.ClientId,
                ClientName = !string.IsNullOrEmpty(invoice.Client?.FirstName) && !string.IsNullOrEmpty(invoice.Client?.LastName)
                    ? invoice.Client.FirstName + " " + invoice.Client.LastName
                    : invoice.Client?.Username ?? "N/A",
                CreatedAt = invoice.CreatedAt,
                SentAt = invoice.SentAt,
                PaidAt = invoice.PaidAt,
                Items = invoice.Items?.Select(item => new InvoiceItemDto
                {
                    Id = item.Id,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    Rate = item.Rate,
                    Total = item.Total
                }).ToList() ?? [],
                Payments = invoice.Payments?.Select(payment => new PaymentDto
                {
                    Id = payment.Id,
                    Amount = payment.Amount,
                    PaymentDate = payment.PaymentDate,
                    Method = payment.Method.ToString(),
                    Status = payment.Status.ToString(),
                    TransactionId = payment.TransactionId,
                    Notes = payment.Notes,
                    CreatedAt = payment.CreatedAt
                }).ToList() ?? []
            };
        }

        #endregion

        [HttpPut("change-password")]
        public async Task<ActionResult> ChangePassword(ChangePasswordDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            // Verify current password
            if (!VerifyPassword(dto.CurrentPassword, user.PasswordHash, user.PasswordSalt))
                return BadRequest("Current password is incorrect.");

            // Validate new password
            if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 6)
                return BadRequest("New password must be at least 6 characters long.");

            if (dto.NewPassword != dto.ConfirmPassword)
                return BadRequest("New password and confirmation do not match.");

            // Hash new password
            CreatePasswordHash(dto.NewPassword, out byte[] passwordHash, out byte[] passwordSalt);

            user.PasswordHash = passwordHash;
            user.PasswordSalt = passwordSalt;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Password changed successfully." });
        }

        [HttpPost("request-account-deletion")]
        public async Task<ActionResult> RequestAccountDeletion(AccountDeletionRequestDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            // Verify password for security
            if (!VerifyPassword(dto.Password, user.PasswordHash, user.PasswordSalt))
                return BadRequest("Password is incorrect.");

            if (user.Role == "freelancer")
            {
                // Check for blocking conditions for freelancers
                var hasUnpaidInvoices = await _context.Invoices
                    .AnyAsync(i => i.FreelancerId == userId &&
                              (i.Status == InvoiceStatus.Sent || i.Status == InvoiceStatus.Overdue));

                if (hasUnpaidInvoices && !dto.ForceDelete)
                {
                    var unpaidInvoices = await _context.Invoices
                        .Include(i => i.Client)
                        .Where(i => i.FreelancerId == userId &&
                                (i.Status == InvoiceStatus.Sent || i.Status == InvoiceStatus.Overdue))
                        .Select(i => new
                        {
                            i.InvoiceNumber,
                            ClientName = !string.IsNullOrEmpty(i.Client!.FirstName) && !string.IsNullOrEmpty(i.Client.LastName)
                                ? i.Client.FirstName + " " + i.Client.LastName
                                : i.Client.Username,
                            i.Amount,
                            i.Status
                        })
                        .ToListAsync();

                    return BadRequest(new
                    {
                        message = "Cannot delete account with unpaid invoices. Please resolve these first or use force delete.",
                        unpaidInvoices,
                        canForceDelete = true
                    });
                }

                // Warn about active projects
                var activeProjects = await _context.Projects
                    .Include(p => p.Client)
                    .Where(p => p.Client!.Role == "client" && p.Deadline > DateTimeOffset.UtcNow)
                    .Select(p => new
                    {
                        p.Title,
                        ClientName = !string.IsNullOrEmpty(p.Client!.FirstName) && !string.IsNullOrEmpty(p.Client.LastName)
                            ? p.Client.FirstName + " " + p.Client.LastName
                            : p.Client.Username,
                        p.Deadline
                    })
                    .ToListAsync();

                if (activeProjects.Count != 0 && !dto.AcknowledgeDataLoss)
                {
                    return BadRequest(new
                    {
                        message = "You have active projects. Deleting your account will permanently remove all data.",
                        activeProjects,
                        requiresAcknowledgment = true
                    });
                }
            }

            // For clients, check if they have active projects
            if (user.Role == "client")
            {
                var clientProjects = await _context.Projects
                    .Where(p => p.ClientId == userId && p.Deadline > DateTimeOffset.UtcNow)
                    .Select(p => new
                    {
                        p.Title,
                        p.Deadline
                    })
                    .ToListAsync();

                if (clientProjects.Count != 0 && !dto.AcknowledgeDataLoss)
                {
                    return BadRequest(new
                    {
                        message = "You have active projects. Deleting your account will permanently remove all data.",
                        activeProjects = clientProjects,
                        requiresAcknowledgment = true
                    });
                }

                if (!dto.AcknowledgeDataLoss)
                {
                    return BadRequest(new
                    {
                        message = "Deleting your account will permanently remove all your data. Please acknowledge to continue.",
                        requiresAcknowledgment = true
                    });
                }
            }

            return Ok(new
            {
                message = "Account deletion request validated. Call the delete endpoint to proceed.",
                userId,
                canProceed = true
            });
        }

        [HttpDelete("delete-account")]
        public async Task<ActionResult> DeleteAccount(ConfirmAccountDeletionDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            // Final password verification
            if (!VerifyPassword(dto.Password, user.PasswordHash, user.PasswordSalt))
                return BadRequest("Password is incorrect.");

            // Confirmation text verification
            if (dto.ConfirmationText != "DELETE MY ACCOUNT")
                return BadRequest("Confirmation text must be 'DELETE MY ACCOUNT'");

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                if (user.Role == "freelancer")
                {
                    // Delete all payments for invoices belonging to this freelancer
                    var invoiceIds = await _context.Invoices
                        .Where(i => i.FreelancerId == userId)
                        .Select(i => i.Id)
                        .ToListAsync();

                    if (invoiceIds.Count != 0)
                    {
                        // Delete payments
                        var payments = await _context.Payments
                            .Where(p => invoiceIds.Contains(p.InvoiceId))
                            .ToListAsync();
                        _context.Payments.RemoveRange(payments);

                        // Delete invoice items
                        var invoiceItems = await _context.InvoiceItems
                            .Where(ii => invoiceIds.Contains(ii.InvoiceId))
                            .ToListAsync();
                        _context.InvoiceItems.RemoveRange(invoiceItems);

                        // Delete invoices
                        var invoices = await _context.Invoices
                            .Where(i => i.FreelancerId == userId)
                            .ToListAsync();
                        _context.Invoices.RemoveRange(invoices);
                    }

                    // Delete project files for projects that will be affected
                    var projectIds = await _context.Projects
                        .Where(p => true) // All projects - you may want to filter by freelancer relationship
                        .Select(p => p.Id)
                        .ToListAsync();

                    if (projectIds.Count != 0)
                    {
                        var projectFiles = await _context.ProjectFiles
                            .Where(pf => projectIds.Contains(pf.ProjectId))
                            .ToListAsync();
                        _context.ProjectFiles.RemoveRange(projectFiles);
                    }

                    // Note: Projects are not deleted as they belong to clients
                    // You may want to handle project ownership transfer here
                }
                else if (user.Role == "client")
                {
                    // For clients, delete their projects and associated data
                    var clientProjectIds = await _context.Projects
                        .Where(p => p.ClientId == userId)
                        .Select(p => p.Id)
                        .ToListAsync();

                    if (clientProjectIds.Count != 0)
                    {
                        // Delete project files
                        var projectFiles = await _context.ProjectFiles
                            .Where(pf => clientProjectIds.Contains(pf.ProjectId))
                            .ToListAsync();
                        _context.ProjectFiles.RemoveRange(projectFiles);

                        // Delete invoices and their associated data for client projects
                        var clientInvoiceIds = await _context.Invoices
                            .Where(i => i.ClientId == userId)
                            .Select(i => i.Id)
                            .ToListAsync();

                        if (clientInvoiceIds.Count != 0)
                        {
                            var payments = await _context.Payments
                                .Where(p => clientInvoiceIds.Contains(p.InvoiceId))
                                .ToListAsync();
                            _context.Payments.RemoveRange(payments);

                            var invoiceItems = await _context.InvoiceItems
                                .Where(ii => clientInvoiceIds.Contains(ii.InvoiceId))
                                .ToListAsync();
                            _context.InvoiceItems.RemoveRange(invoiceItems);

                            var invoices = await _context.Invoices
                                .Where(i => i.ClientId == userId)
                                .ToListAsync();
                            _context.Invoices.RemoveRange(invoices);
                        }

                        // Delete projects
                        var projects = await _context.Projects
                            .Where(p => p.ClientId == userId)
                            .ToListAsync();
                        _context.Projects.RemoveRange(projects);
                    }
                }

                // Delete user skills
                var userSkills = await _context.UserSkills
                    .Where(s => s.UserId == userId)
                    .ToListAsync();
                _context.UserSkills.RemoveRange(userSkills);

                // Delete login history
                var loginHistory = await _context.LoginHistories
                    .Where(l => l.UserId == userId)
                    .ToListAsync();
                _context.LoginHistories.RemoveRange(loginHistory);

                // Delete security audit logs
                var securityLogs = await _context.SecurityAuditLogs
                    .Where(s => s.UserId == userId)
                    .ToListAsync();
                _context.SecurityAuditLogs.RemoveRange(securityLogs);

                // Delete conversation participants
                var conversationParticipants = await _context.ConversationParticipants
                    .Where(cp => cp.UserId == userId)
                    .ToListAsync();
                _context.ConversationParticipants.RemoveRange(conversationParticipants);

                // Delete messages sent by the user
                var userMessages = await _context.Messages
                    .Where(m => m.SenderId == userId)
                    .ToListAsync();
                _context.Messages.RemoveRange(userMessages);

                // Delete message reactions by the user
                var messageReactions = await _context.MessageReactions
                    .Where(mr => mr.UserId == userId)
                    .ToListAsync();
                _context.MessageReactions.RemoveRange(messageReactions);

                // Finally, delete the user
                _context.Users.Remove(user);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Account and all associated data deleted successfully." });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"An error occurred while deleting the account: {ex.Message}");
            }
        }

        [HttpGet("export-data")]
        public async Task<ActionResult> ExportUserData()
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            if (user.Role == "freelancer")
            {
                var exportData = new
                {
                    User = new
                    {
                        user.Username,
                        user.Email,
                        user.Role,
                        user.FirstName,
                        user.LastName,
                        user.Company
                    },
                    Clients = await _context.Users
                        .Where(u => u.Role == "client")
                        .Select(u => new
                        {
                            u.Username,
                            u.Email,
                            u.FirstName,
                            u.LastName,
                            u.Company
                        })
                        .ToListAsync(),
                    Projects = await _context.Projects
                        .Include(p => p.Client)
                        .Where(p => p.Client!.Role == "client")
                        .Select(p => new
                        {
                            p.Title,
                            p.Description,
                            p.Deadline,
                            ClientName = !string.IsNullOrEmpty(p.Client!.FirstName) && !string.IsNullOrEmpty(p.Client.LastName)
                                ? p.Client.FirstName + " " + p.Client.LastName
                                : p.Client.Username
                        })
                        .ToListAsync(),
                    Invoices = await _context.Invoices
                        .Include(i => i.Client)
                        .Include(i => i.Project)
                        .Include(i => i.Items)
                        .Where(i => i.FreelancerId == userId)
                        .Select(i => new
                        {
                            i.InvoiceNumber,
                            i.Title,
                            i.Amount,
                            i.Status,
                            i.IssueDate,
                            i.DueDate,
                            ClientName = !string.IsNullOrEmpty(i.Client!.FirstName) && !string.IsNullOrEmpty(i.Client.LastName)
                                ? i.Client.FirstName + " " + i.Client.LastName
                                : i.Client.Username,
                            ProjectTitle = i.Project!.Title,
                            Items = i.Items.Select(item => new
                            {
                                item.Description,
                                item.Quantity,
                                item.Rate,
                                item.Total
                            })
                        })
                        .ToListAsync(),
                    ExportDate = DateTime.UtcNow
                };

                return Ok(exportData);
            }
            else // client role
            {
                var exportData = new
                {
                    User = new
                    {
                        user.Username,
                        user.Email,
                        user.Role,
                        user.FirstName,
                        user.LastName,
                        user.Company
                    },
                    Projects = await _context.Projects
                        .Where(p => p.ClientId == userId)
                        .Select(p => new
                        {
                            p.Title,
                            p.Description,
                            p.Deadline
                        })
                        .ToListAsync(),
                    Invoices = await _context.Invoices
                        .Include(i => i.Items)
                        .Where(i => i.ClientId == userId)
                        .Select(i => new
                        {
                            i.InvoiceNumber,
                            i.Title,
                            i.Amount,
                            i.Status,
                            i.IssueDate,
                            i.DueDate,
                            Items = i.Items.Select(item => new
                            {
                                item.Description,
                                item.Quantity,
                                item.Rate,
                                item.Total
                            })
                        })
                        .ToListAsync(),
                    ExportDate = DateTime.UtcNow
                };

                return Ok(exportData);
            }
        }

        #region Advanced Security Features

        [HttpGet("security-audit-logs")]
        public async Task<ActionResult<List<SecurityAuditLogDto>>> GetSecurityAuditLogs(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var userId = GetUserId();
            var logs = await _securityAuditService.GetUserAuditLogsAsync(userId, page, pageSize);
            return Ok(logs);
        }

        [HttpPut("preferences")]
        public async Task<ActionResult> UpdatePreferences(UserPreferencesDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            user.EmailNotifications = dto.EmailNotifications;
            user.SmsNotifications = dto.SmsNotifications;
            user.MarketingEmails = dto.MarketingEmails;
            user.TimeZone = dto.TimeZone;
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            await _securityAuditService.LogAsync(userId, "preferences_updated",
                "User preferences updated", HttpContext);

            return Ok(new { message = "User preferences updated successfully." });
        }

        /// <summary>
        /// Search for users to start conversations with
        /// </summary>
        [HttpGet("search")]
        public async Task<ActionResult<List<UserSearchResultDto>>> SearchUsers(
            [FromQuery] string q,
            [FromQuery] int limit = 10)
        {
            try
            {
                var currentUserId = GetUserId();

                if (string.IsNullOrWhiteSpace(q))
                    return BadRequest(new { message = "Search query is required" });

                if (q.Length < 2)
                    return BadRequest(new { message = "Search query must be at least 2 characters" });

                if (limit > 50) limit = 50; // Prevent abuse
                if (limit < 1) limit = 10; // Default limit

                var searchTerm = q.Trim().ToLower();

                var users = await _context.Users
                    .Where(u => u.Id != currentUserId &&
                               (u.FirstName.Contains(searchTerm, StringComparison.CurrentCultureIgnoreCase) ||
                                u.LastName.Contains(searchTerm, StringComparison.CurrentCultureIgnoreCase) ||
                                u.Username.Contains(searchTerm, StringComparison.CurrentCultureIgnoreCase) ||
                                u.Email.Contains(searchTerm, StringComparison.CurrentCultureIgnoreCase) ||
                                (u.FirstName + " " + u.LastName).Contains(searchTerm, StringComparison.CurrentCultureIgnoreCase)))
                    .OrderBy(u => u.FirstName)
                    .ThenBy(u => u.LastName)
                    .Take(limit)
                    .Select(u => new UserSearchResultDto
                    {
                        Id = u.Id,
                        Username = u.Username,
                        FirstName = u.FirstName,
                        LastName = u.LastName,
                        Email = u.ShowEmail ? u.Email : null, // Respect privacy settings
                        Role = u.Role,
                        Company = u.Company,
                        ProfileImageUrl = u.ProfileImageUrl,
                        DisplayName = !string.IsNullOrEmpty(u.FirstName) && !string.IsNullOrEmpty(u.LastName)
                            ? u.FirstName + " " + u.LastName
                            : u.Username,
                        IsOnline = u.LastLoginAt.HasValue && u.LastLoginAt.Value > DateTime.UtcNow.AddMinutes(-5)
                    })
                    .ToListAsync();

                return Ok(users);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized(new { message = "User not authenticated" });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "An error occurred while searching users" });
            }
        }

        #endregion
    }
}
