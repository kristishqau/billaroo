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
    [Authorize(Roles = "freelancer")]
    public class ClientsController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost]
        public async Task<ActionResult<ClientDto>> CreateClient(CreateClientDto dto)
        {
            // Validate required fields
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Client name is required.");

            // Check for duplicate email if provided
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var existingClient = await _context.Clients
                    .AnyAsync(c => c.Email == dto.Email && c.FreelancerId == GetUserId());

                if (existingClient)
                    return BadRequest("A client with this email already exists in your portfolio.");
            }

            var client = new Client
            {
                Name = dto.Name,
                Email = dto.Email,
                Company = dto.Company,
                FreelancerId = GetUserId()
            };

            _context.Clients.Add(client);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetClient), new { id = client.Id }, new ClientDto
            {
                Id = client.Id,
                Name = client.Name,
                Email = client.Email,
                Company = client.Company
            });
        }

        [HttpGet]
        public async Task<ActionResult<List<ClientDto>>> GetMyClients()
        {
            var userId = GetUserId();

            var clients = await _context.Clients
                .Where(c => c.FreelancerId == userId)
                .Select(c => new ClientDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Email = c.Email,
                    Company = c.Company
                })
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(clients);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ClientDetailDto>> GetClient(int id)
        {
            var userId = GetUserId();

            var client = await _context.Clients
                .Where(c => c.Id == id && c.FreelancerId == userId)
                .Select(c => new ClientDetailDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Email = c.Email,
                    Company = c.Company,
                    ProjectCount = _context.Projects.Count(p => p.ClientId == c.Id),
                    TotalInvoiceAmount = _context.Invoices
                        .Where(i => i.ClientId == c.Id)
                        .Sum(i => (decimal?)i.Amount) ?? 0,
                    PaidInvoiceAmount = _context.Invoices
                        .Where(i => i.ClientId == c.Id && i.Status == InvoiceStatus.Paid)
                        .Sum(i => (decimal?)i.Amount) ?? 0
                })
                .FirstOrDefaultAsync();

            if (client == null)
                return NotFound("Client not found or access denied.");

            return Ok(client);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<ClientDto>> UpdateClient(int id, UpdateClientDto dto)
        {
            var userId = GetUserId();

            var client = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == id && c.FreelancerId == userId);

            if (client == null)
                return NotFound("Client not found or access denied.");

            // Validate required fields
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Client name is required.");

            // Check for duplicate email if changed
            if (!string.IsNullOrWhiteSpace(dto.Email) && dto.Email != client.Email)
            {
                var existingClient = await _context.Clients
                    .AnyAsync(c => c.Email == dto.Email && c.FreelancerId == userId && c.Id != id);

                if (existingClient)
                    return BadRequest("A client with this email already exists in your portfolio.");
            }

            // Update client properties
            client.Name = dto.Name;
            client.Email = dto.Email;
            client.Company = dto.Company;

            await _context.SaveChangesAsync();

            return Ok(new ClientDto
            {
                Id = client.Id,
                Name = client.Name,
                Email = client.Email,
                Company = client.Company
            });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteClient(int id)
        {
            var userId = GetUserId();

            var client = await _context.Clients
                .Include(c => c.Freelancer)
                .FirstOrDefaultAsync(c => c.Id == id && c.FreelancerId == userId);

            if (client == null)
                return NotFound("Client not found or access denied.");

            // Check for existing invoices
            var hasInvoices = await _context.Invoices
                .AnyAsync(i => i.ClientId == id);

            if (hasInvoices)
                return BadRequest("Cannot delete client with existing invoices. Please handle invoices first.");

            // Check for existing projects with files
            var projectsWithFiles = await _context.Projects
                .Where(p => p.ClientId == id)
                .AnyAsync(p => _context.ProjectFiles.Any(pf => pf.ProjectId == p.Id));

            if (projectsWithFiles)
                return BadRequest("Cannot delete client with projects containing files. Please remove project files first.");

            // Use transaction to ensure data integrity
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Delete all projects for this client (cascade will handle project files if any remain)
                var projects = await _context.Projects
                    .Where(p => p.ClientId == id)
                    .ToListAsync();

                _context.Projects.RemoveRange(projects);

                // Delete the client
                _context.Clients.Remove(client);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new { message = "Client and associated projects deleted successfully." });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred while deleting the client.");
            }
        }

        [HttpGet("{id}/projects")]
        public async Task<ActionResult<List<ProjectDto>>> GetClientProjects(int id)
        {
            var userId = GetUserId();

            // Verify client belongs to freelancer
            var clientExists = await _context.Clients
                .AnyAsync(c => c.Id == id && c.FreelancerId == userId);

            if (!clientExists)
                return NotFound("Client not found or access denied.");

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

        [HttpGet("{id}/invoices")]
        public async Task<ActionResult<List<InvoiceDto>>> GetClientInvoices(int id)
        {
            var userId = GetUserId();

            // Verify client belongs to freelancer
            var clientExists = await _context.Clients
                .AnyAsync(c => c.Id == id && c.FreelancerId == userId);

            if (!clientExists)
                return NotFound("Client not found or access denied.");

            var invoices = await _context.Invoices
                .Include(i => i.Items)
                .Include(i => i.Project)
                .Include(i => i.Payments)
                .Where(i => i.ClientId == id)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return Ok(invoices.Select(MapToInvoiceDto).ToList());
        }

        // Helper method to map Invoice to InvoiceDto (reused from InvoicesController)
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
                ClientName = invoice.Client?.Name ?? "N/A",
                CreatedAt = invoice.CreatedAt,
                SentAt = invoice.SentAt,
                PaidAt = invoice.PaidAt,
                Items = invoice.Items.Select(item => new InvoiceItemDto
                {
                    Id = item.Id,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    Rate = item.Rate,
                    Total = item.Total
                }).ToList(),
                Payments = invoice.Payments.Select(payment => new PaymentDto
                {
                    Id = payment.Id,
                    Amount = payment.Amount,
                    PaymentDate = payment.PaymentDate,
                    Method = payment.Method.ToString(),
                    Status = payment.Status.ToString(),
                    TransactionId = payment.TransactionId,
                    Notes = payment.Notes,
                    CreatedAt = payment.CreatedAt
                }).ToList()
            };
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<ClientDto>>> SearchClients([FromQuery] string searchTerm)
        {
            var userId = GetUserId();

            if (string.IsNullOrWhiteSpace(searchTerm))
                return await GetMyClients();

            var clients = await _context.Clients
                .Where(c => c.FreelancerId == userId &&
                           (c.Name.Contains(searchTerm) ||
                            c.Email!.Contains(searchTerm) ||
                            c.Company!.Contains(searchTerm)))
                .Select(c => new ClientDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Email = c.Email,
                    Company = c.Company
                })
                .OrderBy(c => c.Name)
                .ToListAsync();

            return Ok(clients);
        }

        [HttpGet("stats")]
        public async Task<ActionResult<ClientStatsDto>> GetClientStats()
        {
            var userId = GetUserId();

            var totalClients = await _context.Clients.CountAsync(c => c.FreelancerId == userId);

            var clientsWithProjects = await _context.Clients
                .Where(c => c.FreelancerId == userId)
                .CountAsync(c => _context.Projects.Any(p => p.ClientId == c.Id));

            var clientsWithUnpaidInvoices = await _context.Clients
                .Where(c => c.FreelancerId == userId)
                .CountAsync(c => _context.Invoices.Any(i => i.ClientId == c.Id &&
                                                           (i.Status == InvoiceStatus.Sent || i.Status == InvoiceStatus.Overdue)));

            var topClientsByRevenue = await _context.Clients
                .Where(c => c.FreelancerId == userId)
                .Select(c => new
                {
                    ClientName = c.Name,
                    TotalRevenue = _context.Invoices
                        .Where(i => i.ClientId == c.Id && i.Status == InvoiceStatus.Paid)
                        .Sum(i => (decimal?)i.Amount) ?? 0
                })
                .Where(x => x.TotalRevenue > 0)
                .OrderByDescending(x => x.TotalRevenue)
                .Take(5)
                .ToListAsync();

            return Ok(new ClientStatsDto
            {
                TotalClients = totalClients,
                ClientsWithProjects = clientsWithProjects,
                ClientsWithUnpaidInvoices = clientsWithUnpaidInvoices,
                TopClientsByRevenue = topClientsByRevenue
            });
        }

        [HttpPost("{id}/merge")]
        public async Task<ActionResult> MergeClients(int id, MergeClientDto dto)
        {
            var userId = GetUserId();

            // Validate both clients exist and belong to freelancer
            var primaryClient = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == id && c.FreelancerId == userId);

            var secondaryClient = await _context.Clients
                .FirstOrDefaultAsync(c => c.Id == dto.SecondaryClientId && c.FreelancerId == userId);

            if (primaryClient == null || secondaryClient == null)
                return BadRequest("One or both clients not found or not yours.");

            if (primaryClient.Id == secondaryClient.Id)
                return BadRequest("Cannot merge client with itself.");

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // Move all projects from secondary to primary client
                var projects = await _context.Projects
                    .Where(p => p.ClientId == secondaryClient.Id)
                    .ToListAsync();

                foreach (var project in projects)
                {
                    project.ClientId = primaryClient.Id;
                }

                // Move all invoices from secondary to primary client
                var invoices = await _context.Invoices
                    .Where(i => i.ClientId == secondaryClient.Id)
                    .ToListAsync();

                foreach (var invoice in invoices)
                {
                    invoice.ClientId = primaryClient.Id;
                }

                // Update primary client with merged data if specified
                if (dto.MergeData)
                {
                    if (string.IsNullOrWhiteSpace(primaryClient.Email) && !string.IsNullOrWhiteSpace(secondaryClient.Email))
                        primaryClient.Email = secondaryClient.Email;

                    if (string.IsNullOrWhiteSpace(primaryClient.Company) && !string.IsNullOrWhiteSpace(secondaryClient.Company))
                        primaryClient.Company = secondaryClient.Company;
                }

                // Delete secondary client
                _context.Clients.Remove(secondaryClient);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    message = $"Client '{secondaryClient.Name}' merged into '{primaryClient.Name}' successfully.",
                    projectsMoved = projects.Count,
                    invoicesMoved = invoices.Count
                });
            }
            catch (Exception)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, "An error occurred while merging clients.");
            }
        }
    }
}