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
    public class PaymentsController(AppDbContext context) : ControllerBase
    {
        private readonly AppDbContext _context = context;

        private int GetUserId() =>
            int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpPost("invoice/{invoiceId}")]
        public async Task<ActionResult<PaymentDto>> RecordPayment(int invoiceId, CreatePaymentDto dto)
        {
            var userId = GetUserId();

            // Verify invoice belongs to freelancer
            var invoice = await _context.Invoices
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(i => i.Id == invoiceId && i.FreelancerId == userId);

            if (invoice == null)
                return BadRequest("Invoice not found or not yours.");

            // Check if payment amount exceeds remaining balance
            var totalPaid = invoice.Payments.Where(p => p.Status == PaymentStatus.Completed).Sum(p => p.Amount);
            var remainingBalance = invoice.Amount - totalPaid;

            if (dto.Amount > remainingBalance)
                return BadRequest($"Payment amount exceeds remaining balance of ${remainingBalance:F2}");

            var payment = new Payment
            {
                Amount = dto.Amount,
                PaymentDate = DateTime.UtcNow,
                Method = dto.Method,
                Status = PaymentStatus.Completed, // For mock payments, mark as completed immediately
                TransactionId = dto.TransactionId ?? Guid.NewGuid().ToString(),
                Notes = dto.Notes,
                InvoiceId = invoiceId
            };

            _context.Payments.Add(payment);

            // Update invoice status if fully paid
            var newTotalPaid = totalPaid + dto.Amount;
            if (newTotalPaid >= invoice.Amount)
            {
                invoice.Status = InvoiceStatus.Paid;
                invoice.PaidAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            return Ok(new PaymentDto
            {
                Id = payment.Id,
                Amount = payment.Amount,
                PaymentDate = payment.PaymentDate,
                Method = payment.Method.ToString(),
                Status = payment.Status.ToString(),
                TransactionId = payment.TransactionId,
                Notes = payment.Notes,
                CreatedAt = payment.CreatedAt
            });
        }

        [HttpGet("invoice/{invoiceId}")]
        public async Task<ActionResult<List<PaymentDto>>> GetPaymentsByInvoice(int invoiceId)
        {
            var userId = GetUserId();

            // Verify invoice belongs to freelancer
            var invoiceExists = await _context.Invoices
                .AnyAsync(i => i.Id == invoiceId && i.FreelancerId == userId);

            if (!invoiceExists)
                return BadRequest("Invoice not found or not yours.");

            var payments = await _context.Payments
                .Where(p => p.InvoiceId == invoiceId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PaymentDto
                {
                    Id = p.Id,
                    Amount = p.Amount,
                    PaymentDate = p.PaymentDate,
                    Method = p.Method.ToString(),
                    Status = p.Status.ToString(),
                    TransactionId = p.TransactionId,
                    Notes = p.Notes,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            return Ok(payments);
        }

        [HttpGet]
        public async Task<ActionResult<List<PaymentDto>>> GetMyPayments()
        {
            var userId = GetUserId();

            var payments = await _context.Payments
                .Include(p => p.Invoice)
                .Where(p => p.Invoice!.FreelancerId == userId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new PaymentDto
                {
                    Id = p.Id,
                    Amount = p.Amount,
                    PaymentDate = p.PaymentDate,
                    Method = p.Method.ToString(),
                    Status = p.Status.ToString(),
                    TransactionId = p.TransactionId,
                    Notes = p.Notes,
                    CreatedAt = p.CreatedAt
                })
                .ToListAsync();

            return Ok(payments);
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult> UpdatePaymentStatus(int id, [FromBody] string status)
        {
            var userId = GetUserId();

            var payment = await _context.Payments
                .Include(p => p.Invoice)
                .FirstOrDefaultAsync(p => p.Id == id && p.Invoice!.FreelancerId == userId);

            if (payment == null)
                return NotFound();

            if (!Enum.TryParse<PaymentStatus>(status, out var paymentStatus))
                return BadRequest("Invalid status value");

            var oldStatus = payment.Status;
            payment.Status = paymentStatus;

            // Update invoice status based on payment changes
            if (payment.Invoice != null)
            {
                var totalPaid = await _context.Payments
                    .Where(p => p.InvoiceId == payment.InvoiceId && p.Status == PaymentStatus.Completed)
                    .SumAsync(p => p.Amount);

                // Include current payment if it's being marked as completed
                if (paymentStatus == PaymentStatus.Completed && oldStatus != PaymentStatus.Completed)
                    totalPaid += payment.Amount;
                // Exclude current payment if it's being changed from completed
                else if (paymentStatus != PaymentStatus.Completed && oldStatus == PaymentStatus.Completed)
                    totalPaid -= payment.Amount;

                if (totalPaid >= payment.Invoice.Amount)
                {
                    payment.Invoice.Status = InvoiceStatus.Paid;
                    payment.Invoice.PaidAt = DateTime.UtcNow;
                }
                else if (payment.Invoice.Status == InvoiceStatus.Paid)
                {
                    payment.Invoice.Status = InvoiceStatus.Sent;
                    payment.Invoice.PaidAt = null;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment status updated successfully" });
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeletePayment(int id)
        {
            var userId = GetUserId();

            var payment = await _context.Payments
                .Include(p => p.Invoice)
                .FirstOrDefaultAsync(p => p.Id == id && p.Invoice!.FreelancerId == userId);

            if (payment == null)
                return NotFound();

            // Update invoice status if needed
            if (payment.Invoice != null && payment.Status == PaymentStatus.Completed)
            {
                var totalPaid = await _context.Payments
                    .Where(p => p.InvoiceId == payment.InvoiceId && p.Id != payment.Id && p.Status == PaymentStatus.Completed)
                    .SumAsync(p => p.Amount);

                if (totalPaid < payment.Invoice.Amount)
                {
                    payment.Invoice.Status = InvoiceStatus.Sent;
                    payment.Invoice.PaidAt = null;
                }
            }

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Payment deleted successfully" });
        }

        // Mock Stripe webhook endpoint
        [HttpPost("webhook/stripe")]
        [AllowAnonymous]
        public async Task<ActionResult> StripeWebhook()
        {
            // This is a mock endpoint for Stripe webhooks
            // In a real implementation, you would:
            // 1. Verify the webhook signature
            // 2. Parse the event data
            // 3. Update payment status based on the event

            try
            {
                // Mock webhook processing
                var body = await new StreamReader(Request.Body).ReadToEndAsync();

                // Log webhook received (in real app, use proper logging)
                Console.WriteLine($"Stripe webhook received: {body}");

                // In a real implementation, parse the event and update payments
                // Example:
                // var stripeEvent = EventUtility.ParseEvent(body);
                // switch (stripeEvent.Type)
                // {
                //     case Events.PaymentIntentSucceeded:
                //         // Handle successful payment
                //         break;
                //     case Events.PaymentIntentPaymentFailed:
                //         // Handle failed payment
                //         break;
                // }

                return Ok();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Webhook error: {ex.Message}");
                return StatusCode(500);
            }
        }
    }
}