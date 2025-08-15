using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server.Data;
using Server.DTOs;
using Server.Models;
using Server.Services;
using Server.Services.Interfaces;
using System.Security.Claims;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "freelancer")]
    public class InvoicesController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPdfService _pdfService;
        private readonly IEmailService _emailService;

        public InvoicesController(AppDbContext context, IPdfService pdfService, IEmailService emailService)
        {
            _context = context;
            _pdfService = pdfService;
            _emailService = emailService;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        [HttpPost]
        public async Task<ActionResult<InvoiceDto>> CreateInvoice(CreateInvoiceDto dto)
        {
            try
            {
                var userId = GetUserId();

                // Verify project belongs to freelancer
                var project = await _context.Projects
                    .Include(p => p.Client)
                    .FirstOrDefaultAsync(p => p.Id == dto.ProjectId && p.Client!.FreelancerId == userId);

                if (project == null)
                    return BadRequest("Project not found or not yours.");

                // Generate invoice number
                var currentMonth = DateTime.Now.ToString("yyyyMM");
                var shortGuid = Guid.NewGuid().ToString("N")[..8].ToUpper();
                var invoiceNumber = $"INV-{currentMonth}-{shortGuid}";

                // Calculate total amount from items
                var totalAmount = dto.Items.Sum(item => item.Quantity * item.Rate);

                var invoice = new Invoice
                {
                    InvoiceNumber = invoiceNumber,
                    Title = dto.Title,
                    Description = dto.Description ?? string.Empty,
                    Amount = totalAmount,
                    IssueDate = DateTime.UtcNow,
                    DueDate = dto.DueDate,
                    ProjectId = dto.ProjectId,
                    ClientId = project.ClientId,
                    FreelancerId = userId,
                    Status = InvoiceStatus.Draft,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Invoices.Add(invoice);
                await _context.SaveChangesAsync();

                // Add invoice items
                foreach (var itemDto in dto.Items)
                {
                    var item = new InvoiceItem
                    {
                        Description = itemDto.Description,
                        Quantity = itemDto.Quantity,
                        Rate = itemDto.Rate,
                        InvoiceId = invoice.Id
                    };
                    _context.InvoiceItems.Add(item);
                }

                await _context.SaveChangesAsync();

                // Load the complete invoice for response
                var createdInvoice = await _context.Invoices
                    .Include(i => i.Items)
                    .Include(i => i.Project)
                    .Include(i => i.Client)
                    .Include(i => i.Payments)
                    .FirstAsync(i => i.Id == invoice.Id);

                return Ok(MapToInvoiceDto(createdInvoice));
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine($"Error creating invoice: {ex.Message}");
                return StatusCode(500, new { message = "Failed to create invoice", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<InvoiceDto>> UpdateInvoice(int id, UpdateInvoiceDto dto)
        {
            try
            {
                var userId = GetUserId();

                var invoice = await _context.Invoices
                    .Include(i => i.Items)
                    .Include(i => i.Project)
                    .ThenInclude(p => p.Client)
                    .FirstOrDefaultAsync(i => i.Id == id && i.FreelancerId == userId);

                if (invoice == null)
                    return NotFound("Invoice not found or not yours.");

                if (invoice.Status != InvoiceStatus.Draft)
                    return BadRequest("Only draft invoices can be edited.");

                // Verify project belongs to freelancer if project is being changed
                if (dto.ProjectId != invoice.ProjectId)
                {
                    var project = await _context.Projects
                        .Include(p => p.Client)
                        .FirstOrDefaultAsync(p => p.Id == dto.ProjectId && p.Client!.FreelancerId == userId);

                    if (project == null)
                        return BadRequest("Project not found or not yours.");

                    invoice.ProjectId = dto.ProjectId;
                    invoice.ClientId = project.ClientId;
                }

                // Update invoice properties
                invoice.Title = dto.Title;
                invoice.Description = dto.Description ?? string.Empty;
                invoice.DueDate = dto.DueDate;

                // Remove existing items
                _context.InvoiceItems.RemoveRange(invoice.Items);

                // Add new items
                var totalAmount = 0m;
                foreach (var itemDto in dto.Items)
                {
                    var itemTotal = itemDto.Quantity * itemDto.Rate;
                    var item = new InvoiceItem
                    {
                        Description = itemDto.Description,
                        Quantity = itemDto.Quantity,
                        Rate = itemDto.Rate,
                        // Removed Total assignment - assuming it's calculated property
                        InvoiceId = invoice.Id
                    };
                    _context.InvoiceItems.Add(item);
                    totalAmount += itemTotal;
                }

                invoice.Amount = totalAmount;

                await _context.SaveChangesAsync();

                // Load the complete updated invoice for response
                var updatedInvoice = await _context.Invoices
                    .Include(i => i.Items)
                    .Include(i => i.Project)
                    .Include(i => i.Client)
                    .Include(i => i.Payments)
                    .FirstAsync(i => i.Id == invoice.Id);

                return Ok(MapToInvoiceDto(updatedInvoice));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating invoice: {ex.Message}");
                return StatusCode(500, new { message = "Failed to update invoice", error = ex.Message });
            }
        }

        [HttpGet]
        public async Task<ActionResult<List<InvoiceDto>>> GetMyInvoices()
        {
            try
            {
                var userId = GetUserId();

                var invoices = await _context.Invoices
                    .Include(i => i.Items)
                    .Include(i => i.Project)
                    .Include(i => i.Client)
                    .Include(i => i.Payments)
                    .Where(i => i.FreelancerId == userId)
                    .OrderByDescending(i => i.CreatedAt)
                    .ToListAsync();

                return Ok(invoices.Select(MapToInvoiceDto).ToList());
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching invoices: {ex.Message}");
                return StatusCode(500, new { message = "Failed to fetch invoices", error = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InvoiceDto>> GetInvoice(int id)
        {
            try
            {
                var userId = GetUserId();

                var invoice = await _context.Invoices
                    .Include(i => i.Items)
                    .Include(i => i.Project)
                    .Include(i => i.Client)
                    .Include(i => i.Payments)
                    .FirstOrDefaultAsync(i => i.Id == id && i.FreelancerId == userId);

                if (invoice == null)
                    return NotFound();

                return Ok(MapToInvoiceDto(invoice));
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error fetching invoice: {ex.Message}");
                return StatusCode(500, new { message = "Failed to fetch invoice", error = ex.Message });
            }
        }

        [HttpPost("{id}/send")]
        public async Task<ActionResult> SendInvoice(int id, SendInvoiceDto dto)
        {
            var userId = GetUserId();

            var invoice = await _context.Invoices
                .Include(i => i.Items)
                .Include(i => i.Project)
                .Include(i => i.Client)
                .Include(i => i.Freelancer)
                .FirstOrDefaultAsync(i => i.Id == id && i.FreelancerId == userId);

            if (invoice == null)
                return NotFound();

            if (invoice.Status != InvoiceStatus.Draft)
                return BadRequest("Invoice has already been sent.");

            try
            {
                // Generate PDF
                var pdfBytes = _pdfService.GenerateInvoicePdf(invoice);

                // Send email
                var subject = dto.Subject ?? $"Invoice #{invoice.InvoiceNumber}";
                var message = dto.Message ?? "Please find your invoice attached.";

                await _emailService.SendInvoiceEmailAsync(dto.ToEmail, subject, message, pdfBytes, invoice.InvoiceNumber);

                // Update invoice status
                invoice.Status = InvoiceStatus.Sent;
                invoice.SentAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { message = "Invoice sent successfully" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to send invoice: {ex.Message}");
            }
        }

        [HttpGet("{id}/pdf")]
        public async Task<ActionResult> DownloadInvoicePdf(int id)
        {
            var userId = GetUserId();

            var invoice = await _context.Invoices
                .Include(i => i.Items)
                .Include(i => i.Project)
                .Include(i => i.Client)
                .Include(i => i.Freelancer)
                .FirstOrDefaultAsync(i => i.Id == id && i.FreelancerId == userId);

            if (invoice == null)
                return NotFound();

            try
            {
                var pdfBytes = _pdfService.GenerateInvoicePdf(invoice);
                return File(pdfBytes, "application/pdf", $"Invoice-{invoice.InvoiceNumber}.pdf");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Failed to generate PDF: {ex.Message}");
            }
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult> UpdateInvoiceStatus(int id, [FromBody] string status)
        {
            var userId = GetUserId();

            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == id && i.FreelancerId == userId);

            if (invoice == null)
                return NotFound();

            if (Enum.TryParse<InvoiceStatus>(status, out var invoiceStatus))
            {
                invoice.Status = invoiceStatus;
                if (invoiceStatus == InvoiceStatus.Paid && invoice.PaidAt == null)
                    invoice.PaidAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();
                return Ok(new { message = "Invoice status updated successfully" });
            }
            else
            {
                return BadRequest("Invalid status value");
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteInvoice(int id)
        {
            var userId = GetUserId();

            var invoice = await _context.Invoices
                .FirstOrDefaultAsync(i => i.Id == id && i.FreelancerId == userId);

            if (invoice == null)
                return NotFound();

            if (invoice.Status != InvoiceStatus.Draft)
                return BadRequest("Only draft invoices can be deleted.");

            _context.Invoices.Remove(invoice);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Invoice deleted successfully" });
        }

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
                Items = invoice.Items?.Select(item => new InvoiceItemDto
                {
                    Id = item.Id,
                    Description = item.Description,
                    Quantity = item.Quantity,
                    Rate = item.Rate,
                    Total = item.Total
                }).ToList() ?? new List<InvoiceItemDto>(),
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
                }).ToList() ?? new List<PaymentDto>()
            };
        }
    }
}
