using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;
using System.Security.Claims;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ProjectsController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private string GetUserRole() =>
            User.FindFirstValue(ClaimTypes.Role)!;

        [HttpPost]
        [Authorize(Roles = "freelancer")]
        public async Task<ActionResult<ProjectDto>> CreateProject(CreateProjectDto dto)
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest("Project title is required.");

            if (dto.Deadline <= DateTime.UtcNow)
                return BadRequest("Project deadline must be in the future.");

            // Verify the client exists and has client role
            var client = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == dto.ClientId && u.Role == "client");

            if (client == null)
                return BadRequest("Client not found.");

            var project = new Project
            {
                Title = dto.Title,
                Description = dto.Description,
                Deadline = dto.Deadline,
                ClientId = client.Id
            };

            _context.Projects.Add(project);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProject), new { id = project.Id }, new ProjectDto
            {
                Id = project.Id,
                Title = project.Title,
                Description = project.Description,
                Deadline = project.Deadline,
                ClientId = project.ClientId
            });
        }

        [HttpGet]
        public async Task<ActionResult<List<ProjectDetailDto>>> GetMyProjects()
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            List<ProjectDetailDto> projects;

            if (userRole == "freelancer")
            {
                // Freelancers see all projects (you may want to add business logic to filter by their clients)
                projects = await _context.Projects
                    .Include(p => p.Client)
                    .Where(p => p.Client!.Role == "client")
                    .Select(p => new ProjectDetailDto
                    {
                        Id = p.Id,
                        Title = p.Title,
                        Description = p.Description,
                        Deadline = p.Deadline,
                        ClientId = p.ClientId,
                        ClientName = !string.IsNullOrEmpty(p.Client!.FirstName) && !string.IsNullOrEmpty(p.Client.LastName)
                            ? p.Client.FirstName + " " + p.Client.LastName
                            : p.Client.Username,
                        ClientCompany = p.Client.Company,
                        InvoiceCount = _context.Invoices.Count(i => i.ProjectId == p.Id),
                        FileCount = _context.ProjectFiles.Count(pf => pf.ProjectId == p.Id),
                        IsOverdue = p.Deadline < DateTime.UtcNow,
                        TotalInvoiceAmount = _context.Invoices
                            .Where(i => i.ProjectId == p.Id)
                            .Sum(i => (decimal?)i.Amount) ?? 0
                    })
                    .OrderBy(p => p.Deadline)
                    .ToListAsync();
            }
            else // client role
            {
                // Clients see only their own projects
                projects = await _context.Projects
                    .Include(p => p.Client)
                    .Where(p => p.ClientId == userId)
                    .Select(p => new ProjectDetailDto
                    {
                        Id = p.Id,
                        Title = p.Title,
                        Description = p.Description,
                        Deadline = p.Deadline,
                        ClientId = p.ClientId,
                        ClientName = !string.IsNullOrEmpty(p.Client!.FirstName) && !string.IsNullOrEmpty(p.Client.LastName)
                            ? p.Client.FirstName + " " + p.Client.LastName
                            : p.Client.Username,
                        ClientCompany = p.Client.Company,
                        InvoiceCount = _context.Invoices.Count(i => i.ProjectId == p.Id),
                        FileCount = _context.ProjectFiles.Count(pf => pf.ProjectId == p.Id),
                        IsOverdue = p.Deadline < DateTime.UtcNow,
                        TotalInvoiceAmount = _context.Invoices
                            .Where(i => i.ProjectId == p.Id)
                            .Sum(i => (decimal?)i.Amount) ?? 0
                    })
                    .OrderBy(p => p.Deadline)
                    .ToListAsync();
            }

            return Ok(projects);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ProjectDetailDto>> GetProject(int id)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            var query = _context.Projects
                .Include(p => p.Client)
                .Where(p => p.Id == id);

            // Apply role-based filtering
            if (userRole == "client")
            {
                query = query.Where(p => p.ClientId == userId);
            }

            var project = await query
                .Select(p => new ProjectDetailDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    Deadline = p.Deadline,
                    ClientId = p.ClientId,
                    ClientName = !string.IsNullOrEmpty(p.Client!.FirstName) && !string.IsNullOrEmpty(p.Client.LastName)
                        ? p.Client.FirstName + " " + p.Client.LastName
                        : p.Client.Username,
                    ClientCompany = p.Client.Company,
                    InvoiceCount = _context.Invoices.Count(i => i.ProjectId == p.Id),
                    FileCount = _context.ProjectFiles.Count(pf => pf.ProjectId == p.Id),
                    IsOverdue = p.Deadline < DateTime.UtcNow,
                    TotalInvoiceAmount = _context.Invoices
                        .Where(i => i.ProjectId == p.Id)
                        .Sum(i => (decimal?)i.Amount) ?? 0
                })
                .FirstOrDefaultAsync();

            if (project == null)
                return NotFound("Project not found or access denied.");

            return Ok(project);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ProjectDto>> UpdateProject(int id, UpdateProjectDto dto)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            IQueryable<Project> query = _context.Projects
                .Include(p => p.Client);

            // Apply role-based filtering
            if (userRole == "client")
            {
                query = query.Where(p => p.ClientId == userId);
            }

            var project = await query.FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound("Project not found or access denied.");

            // Validate required fields
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest("Project title is required.");

            if (dto.Deadline <= DateTime.UtcNow)
                return BadRequest("Project deadline must be in the future.");

            // If client is being changed, verify new client exists and has client role
            if (dto.ClientId != project.ClientId)
            {
                // Only freelancers can change project clients
                if (userRole != "freelancer")
                    return BadRequest("Only freelancers can change project clients.");

                var newClient = await _context.Users
                    .FirstOrDefaultAsync(u => u.Id == dto.ClientId && u.Role == "client");

                if (newClient == null)
                    return BadRequest("New client not found or invalid.");

                // Check if project has invoices - changing client would break invoice relationships
                var hasInvoices = await _context.Invoices.AnyAsync(i => i.ProjectId == id);
                if (hasInvoices)
                    return BadRequest("Cannot change client for project with existing invoices.");
            }

            // Update project properties
            project.Title = dto.Title;
            project.Description = dto.Description;
            project.Deadline = dto.Deadline;
            if (userRole == "freelancer") // Only freelancers can change client
            {
                project.ClientId = dto.ClientId;
            }

            await _context.SaveChangesAsync();

            return Ok(new ProjectDto
            {
                Id = project.Id,
                Title = project.Title,
                Description = project.Description,
                Deadline = project.Deadline,
                ClientId = project.ClientId
            });
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "freelancer")]
        public async Task<ActionResult> DeleteProject(int id)
        {
            var project = await _context.Projects
                .Include(p => p.Client)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound("Project not found.");

            // Check for existing invoices
            var hasInvoices = await _context.Invoices
                .AnyAsync(i => i.ProjectId == id);

            if (hasInvoices)
                return BadRequest("Cannot delete project with existing invoices. Please handle invoices first.");

            // Use transaction to ensure data integrity
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Delete all project files first
                var projectFiles = await _context.ProjectFiles
                    .Where(pf => pf.ProjectId == id)
                    .ToListAsync();

                _context.ProjectFiles.RemoveRange(projectFiles);

                // Delete the project
                _context.Projects.Remove(project);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Project and associated files deleted successfully." });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred while deleting the project.");
            }
        }

        [HttpGet("by-client/{clientId}")]
        public async Task<ActionResult<List<ProjectDto>>> GetProjectsByClient(int clientId)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            // Verify the user exists and has client role
            var clientUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == clientId && u.Role == "client");

            if (clientUser == null)
                return BadRequest("Client not found.");

            // Role-based access control
            if (userRole == "client" && clientId != userId)
                return BadRequest("Access denied."); // Clients can only see their own projects

            var projects = await _context.Projects
                .Where(p => p.ClientId == clientId)
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

        [HttpGet("{id}/files")]
        public async Task<ActionResult<List<ProjectFileDto>>> GetProjectFiles(int id)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            // Verify project exists and user has access
            IQueryable<Project> projectQuery = _context.Projects
                .Include(p => p.Client);

            if (userRole == "client")
            {
                projectQuery = projectQuery.Where(p => p.ClientId == userId);
            }

            var projectExists = await projectQuery.AnyAsync(p => p.Id == id);

            if (!projectExists)
                return NotFound("Project not found or access denied.");

            var files = await _context.ProjectFiles
                .Where(pf => pf.ProjectId == id)
                .Select(pf => new ProjectFileDto
                {
                    Id = pf.Id,
                    FileName = pf.FileName,
                    OriginalFileName = pf.OriginalFileName,
                    ContentType = pf.ContentType,
                    FileSize = pf.FileSize,
                    Type = pf.Type,
                    Description = pf.Description,
                    UploadedAt = pf.UploadedAt
                })
                .OrderByDescending(pf => pf.UploadedAt)
                .ToListAsync();

            return Ok(files);
        }

        [HttpGet("{id}/invoices")]
        public async Task<ActionResult<List<InvoiceDto>>> GetProjectInvoices(int id)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            // Verify project exists and user has access
            IQueryable<Project> projectQuery = _context.Projects
                .Include(p => p.Client);

            if (userRole == "client")
            {
                projectQuery = projectQuery.Where(p => p.ClientId == userId);
            }

            var projectExists = await projectQuery.AnyAsync(p => p.Id == id);

            if (!projectExists)
                return NotFound("Project not found or access denied.");

            var invoiceQuery = _context.Invoices
                .Include(i => i.Items)
                .Include(i => i.Project)
                .Include(i => i.Client)
                .Include(i => i.Payments)
                .Where(i => i.ProjectId == id);

            // Additional filtering for clients
            if (userRole == "client")
            {
                invoiceQuery = invoiceQuery.Where(i => i.ClientId == userId);
            }

            var invoices = await invoiceQuery
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return Ok(invoices.Select(MapToInvoiceDto).ToList());
        }

        [HttpGet("overdue")]
        public async Task<ActionResult<List<ProjectDetailDto>>> GetOverdueProjects()
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            var query = _context.Projects
                .Include(p => p.Client)
                .Where(p => p.Deadline < DateTime.UtcNow);

            if (userRole == "client")
            {
                query = query.Where(p => p.ClientId == userId);
            }
            else if (userRole == "freelancer")
            {
                query = query.Where(p => p.Client!.Role == "client");
            }

            var overdueProjects = await query
                .Select(p => new ProjectDetailDto
                {
                    Id = p.Id,
                    Title = p.Title,
                    Description = p.Description,
                    Deadline = p.Deadline,
                    ClientId = p.ClientId,
                    ClientName = !string.IsNullOrEmpty(p.Client!.FirstName) && !string.IsNullOrEmpty(p.Client.LastName)
                        ? p.Client.FirstName + " " + p.Client.LastName
                        : p.Client.Username,
                    ClientCompany = p.Client.Company,
                    InvoiceCount = _context.Invoices.Count(i => i.ProjectId == p.Id),
                    FileCount = _context.ProjectFiles.Count(pf => pf.ProjectId == p.Id),
                    IsOverdue = true,
                    TotalInvoiceAmount = _context.Invoices
                        .Where(i => i.ProjectId == p.Id)
                        .Sum(i => (decimal?)i.Amount) ?? 0
                })
                .OrderBy(p => p.Deadline)
                .ToListAsync();

            return Ok(overdueProjects);
        }

        [HttpPost("{id}/extend-deadline")]
        public async Task<ActionResult> ExtendDeadline(int id, ExtendDeadlineDto dto)
        {
            var userId = GetUserId();
            var userRole = GetUserRole();

            IQueryable<Project> query = _context.Projects.Include(p => p.Client);

            if (userRole == "client")
            {
                query = query.Where(p => p.ClientId == userId);
            }

            var project = await query.FirstOrDefaultAsync(p => p.Id == id);

            if (project == null)
                return NotFound("Project not found or access denied.");

            if (dto.NewDeadline <= DateTime.UtcNow)
                return BadRequest("New deadline must be in the future.");

            if (dto.NewDeadline <= project.Deadline)
                return BadRequest("New deadline must be later than current deadline.");

            project.Deadline = dto.NewDeadline;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Project deadline extended successfully.",
                newDeadline = project.Deadline
            });
        }

        // Helper method to map Invoice to InvoiceDto
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
    }
}
