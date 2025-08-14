using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class Payment
    {
        public int Id { get; set; }

        [Required]
        public decimal Amount { get; set; }

        [Required]
        public DateTime PaymentDate { get; set; }

        public PaymentMethod Method { get; set; } = PaymentMethod.BankTransfer;

        public PaymentStatus Status { get; set; } = PaymentStatus.Pending;

        public string? TransactionId { get; set; }
        public string? StripePaymentIntentId { get; set; }
        public string? Notes { get; set; }

        public int InvoiceId { get; set; }
        public Invoice? Invoice { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public enum PaymentMethod
    {
        BankTransfer,
        CreditCard,
        PayPal,
        Stripe,
        Cash,
        Other
    }

    public enum PaymentStatus
    {
        Pending,
        Processing,
        Completed,
        Failed,
        Refunded
    }
}