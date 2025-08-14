namespace Server.DTOs
{
    public class ClientDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Company { get; set; }
    }

    public class CreateClientDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Company { get; set; }
    }

    public class UpdateClientDto
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Company { get; set; }
    }

    public class ClientDetailDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Company { get; set; }
        public int ProjectCount { get; set; }
        public decimal TotalInvoiceAmount { get; set; }
        public decimal PaidInvoiceAmount { get; set; }
    }

    public class ClientStatsDto
    {
        public int TotalClients { get; set; }
        public int ClientsWithProjects { get; set; }
        public int ClientsWithUnpaidInvoices { get; set; }
        public object? TopClientsByRevenue { get; set; }
    }

    public class MergeClientDto
    {
        public int SecondaryClientId { get; set; }
        public bool MergeData { get; set; } = true;
    }
}