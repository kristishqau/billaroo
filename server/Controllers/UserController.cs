using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("profile")]
        public async Task<ActionResult<UserProfileDto>> GetProfile()
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            return Ok(new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role
            });
        }

        [HttpPut("profile")]
        public async Task<ActionResult<UserProfileDto>> UpdateProfile(UpdateProfileDto dto)
        {
            var userId = GetUserId();
            var user = await _context.Users.FindAsync(userId);

            if (user == null)
                return NotFound("User not found.");

            // Validate required fields
            if (string.IsNullOrWhiteSpace(dto.Username))
                return BadRequest("Username is required.");

            if (string.IsNullOrWhiteSpace(dto.Email))
                return BadRequest("Email is required.");

            // Check for duplicate username
            if (dto.Username != user.Username)
            {
                var existingUser = await _context.Users
                    .AnyAsync(u => u.Username == dto.Username && u.Id != userId);

                if (existingUser)
                    return BadRequest("Username is already taken.");
            }

            // Check for duplicate email
            if (dto.Email != user.Email)
            {
                var existingUser = await _context.Users
                    .AnyAsync(u => u.Email == dto.Email && u.Id != userId);

                if (existingUser)
                    return BadRequest("Email is already taken.");
            }

            // Update user properties
            user.Username = dto.Username;
            user.Email = dto.Email;

            await _context.SaveChangesAsync();

            return Ok(new UserProfileDto
            {
                Id = user.Id,
                Username = user.Username,
                Email = user.Email,
                Role = user.Role
            });
        }

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

        [HttpGet("account-summary")]
        [Authorize(Roles = "freelancer")]
        public async Task<ActionResult<AccountSummaryDto>> GetAccountSummary()
        {
            var userId = GetUserId();

            var clientCount = await _context.Clients.CountAsync(c => c.FreelancerId == userId);
            var projectCount = await _context.Projects
                .Include(p => p.Client)
                .CountAsync(p => p.Client!.FreelancerId == userId);
            var invoiceCount = await _context.Invoices.CountAsync(i => i.FreelancerId == userId);
            var totalRevenue = await _context.Invoices
                .Where(i => i.FreelancerId == userId && i.Status == InvoiceStatus.Paid)
                .SumAsync(i => (decimal?)i.Amount) ?? 0;
            var pendingRevenue = await _context.Invoices
                .Where(i => i.FreelancerId == userId && i.Status == InvoiceStatus.Sent)
                .SumAsync(i => (decimal?)i.Amount) ?? 0;

            // Check for blocking conditions
            var hasUnpaidInvoices = await _context.Invoices
                .AnyAsync(i => i.FreelancerId == userId &&
                          (i.Status == InvoiceStatus.Sent || i.Status == InvoiceStatus.Overdue));

            var hasActiveProjects = await _context.Projects
                .Include(p => p.Client)
                .AnyAsync(p => p.Client!.FreelancerId == userId && p.Deadline > DateTime.UtcNow);

            return Ok(new AccountSummaryDto
            {
                ClientCount = clientCount,
                ProjectCount = projectCount,
                InvoiceCount = invoiceCount,
                TotalRevenue = totalRevenue,
                PendingRevenue = pendingRevenue,
                HasUnpaidInvoices = hasUnpaidInvoices,
                HasActiveProjects = hasActiveProjects,
                CanDeleteAccount = !hasUnpaidInvoices // Can delete if no unpaid invoices
            });
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
                            InvoiceNumber = i.InvoiceNumber,
                            ClientName = i.Client!.Name,
                            Amount = i.Amount,
                            Status = i.Status
                        })
                        .ToListAsync();

                    return BadRequest(new
                    {
                        message = "Cannot delete account with unpaid invoices. Please resolve these first or use force delete.",
                        unpaidInvoices = unpaidInvoices,
                        canForceDelete = true
                    });
                }

                // Warn about active projects
                var activeProjects = await _context.Projects
                    .Include(p => p.Client)
                    .Where(p => p.Client!.FreelancerId == userId && p.Deadline > DateTime.UtcNow)
                    .Select(p => new
                    {
                        Title = p.Title,
                        ClientName = p.Client!.Name,
                        Deadline = p.Deadline
                    })
                    .ToListAsync();

                if (activeProjects.Any() && !dto.AcknowledgeDataLoss)
                {
                    return BadRequest(new
                    {
                        message = "You have active projects. Deleting your account will permanently remove all data.",
                        activeProjects = activeProjects,
                        requiresAcknowledgment = true
                    });
                }
            }

            // For clients, just verify they understand data loss
            if (user.Role == "client" && !dto.AcknowledgeDataLoss)
            {
                return BadRequest(new
                {
                    message = "Deleting your account will permanently remove all your data. Please acknowledge to continue.",
                    requiresAcknowledgment = true
                });
            }

            return Ok(new
            {
                message = "Account deletion request validated. Call the delete endpoint to proceed.",
                userId = userId,
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
                    // Get all clients for this freelancer
                    var clientIds = await _context.Clients
                        .Where(c => c.FreelancerId == userId)
                        .Select(c => c.Id)
                        .ToListAsync();

                    if (clientIds.Any())
                    {
                        // Delete all payments for invoices belonging to this freelancer
                        var invoiceIds = await _context.Invoices
                            .Where(i => i.FreelancerId == userId)
                            .Select(i => i.Id)
                            .ToListAsync();

                        if (invoiceIds.Any())
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

                        // Delete project files
                        var projectIds = await _context.Projects
                            .Where(p => clientIds.Contains(p.ClientId))
                            .Select(p => p.Id)
                            .ToListAsync();

                        if (projectIds.Any())
                        {
                            var projectFiles = await _context.ProjectFiles
                                .Where(pf => projectIds.Contains(pf.ProjectId))
                                .ToListAsync();
                            _context.ProjectFiles.RemoveRange(projectFiles);
                        }

                        // Delete projects
                        var projects = await _context.Projects
                            .Where(p => clientIds.Contains(p.ClientId))
                            .ToListAsync();
                        _context.Projects.RemoveRange(projects);

                        // Delete clients
                        var clients = await _context.Clients
                            .Where(c => c.FreelancerId == userId)
                            .ToListAsync();
                        _context.Clients.RemoveRange(clients);
                    }
                }
                // else if (user.Role == "client")
                // {
                    // For clients, we would delete their specific data
                    // This depends on how you structure client-specific data
                    // For now, assuming clients don't have their own data to delete
                // }

                // Delete the user
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
                        user.Role
                    },
                    Clients = await _context.Clients
                        .Where(c => c.FreelancerId == userId)
                        .Select(c => new
                        {
                            c.Name,
                            c.Email,
                            c.Company
                        })
                        .ToListAsync(),
                    Projects = await _context.Projects
                        .Include(p => p.Client)
                        .Where(p => p.Client!.FreelancerId == userId)
                        .Select(p => new
                        {
                            p.Title,
                            p.Description,
                            p.Deadline,
                            ClientName = p.Client!.Name
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
                            ClientName = i.Client!.Name,
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

            return Ok(new
            {
                User = new
                {
                    user.Username,
                    user.Email,
                    user.Role
                },
                ExportDate = DateTime.UtcNow
            });
        }

        // Helper methods
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
    }
}