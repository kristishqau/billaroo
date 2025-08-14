using Server.Models;

namespace Server.Services.Interfaces
{
    public interface IPdfService
    {
        byte[] GenerateInvoicePdf(Invoice invoice);
    }
}
