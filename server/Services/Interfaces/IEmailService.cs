namespace Server.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string to, string subject, string body, byte[]? attachment = null, string? attachmentName = null);
        Task SendInvoiceEmailAsync(string to, string subject, string body, byte[] invoicePdf, string invoiceNumber);
    }
}
