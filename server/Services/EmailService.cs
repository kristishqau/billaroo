using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using Server.Services.Interfaces;

namespace Server.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;

        public EmailService(IOptions<EmailSettings> emailSettings)
        {
            _emailSettings = emailSettings.Value;
        }

        public async Task SendEmailAsync(string to, string subject, string body, byte[]? attachment = null, string? attachmentName = null)
        {
            using var smtpClient = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.Port)
            {
                Credentials = new NetworkCredential(_emailSettings.Username, _emailSettings.Password),
                EnableSsl = _emailSettings.EnableSsl
            };

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_emailSettings.FromEmail, _emailSettings.FromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            mailMessage.To.Add(to);

            if (attachment != null && !string.IsNullOrEmpty(attachmentName))
            {
                var stream = new MemoryStream(attachment);
                var attachmentObj = new Attachment(stream, attachmentName, "application/pdf");
                mailMessage.Attachments.Add(attachmentObj);
            }

            await smtpClient.SendMailAsync(mailMessage);
        }

        public async Task SendInvoiceEmailAsync(string to, string subject, string body, byte[] invoicePdf, string invoiceNumber)
        {
            var emailBody = $@"
                <html>
                <body>
                    <h2>Invoice #{invoiceNumber}</h2>
                    <p>{body}</p>
                    <p>Please find the invoice attached as a PDF.</p>
                    <br/>
                    <p>Thank you for your business!</p>
                </body>
                </html>";

            await SendEmailAsync(to, subject, emailBody, invoicePdf, $"Invoice-{invoiceNumber}.pdf");
        }
    }

    public class EmailSettings
    {
        public string SmtpServer { get; set; } = string.Empty;
        public int Port { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public bool EnableSsl { get; set; }
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;
    }
}