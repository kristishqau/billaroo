using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using Server.Models;
using Server.Services.Interfaces;
using System.Reflection.Metadata;
using Document = QuestPDF.Fluent.Document;

namespace Server.Services
{
    public class PdfService : IPdfService
    {
        public byte[] GenerateInvoicePdf(Invoice invoice)
        {
            var document = Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Size(PageSizes.A4);
                    page.Margin(2, Unit.Centimetre);
                    page.PageColor(Colors.White);
                    page.DefaultTextStyle(x => x.FontSize(12));

                    page.Header()
                        .Text("INVOICE")
                        .FontSize(28)
                        .Bold()
                        .FontColor(Colors.Blue.Medium);

                    page.Content()
                        .PaddingVertical(1, Unit.Centimetre)
                        .Column(x =>
                        {
                            // Invoice header info
                            x.Item().Row(row =>
                            {
                                row.RelativeItem().Column(column =>
                                {
                                    column.Item().Text($"Invoice #: {invoice.InvoiceNumber}").Bold();
                                    column.Item().Text($"Issue Date: {invoice.IssueDate:yyyy-MM-dd}");
                                    column.Item().Text($"Due Date: {invoice.DueDate:yyyy-MM-dd}");
                                });

                                row.RelativeItem().Column(column =>
                                {
                                    column.Item().AlignRight().Text($"Status: {invoice.Status}").Bold();
                                    column.Item().AlignRight().Text($"Amount: ${invoice.Amount:F2}").FontSize(16).Bold();
                                });
                            });

                            x.Item().PaddingVertical(20).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                            // Client info
                            x.Item().Row(row =>
                            {
                                row.RelativeItem().Column(column =>
                                {
                                    column.Item().Text("Bill To:").Bold();
                                    column.Item().Text(invoice.Client?.Name ?? "N/A");
                                    if (!string.IsNullOrEmpty(invoice.Client?.Company))
                                        column.Item().Text(invoice.Client.Company);
                                    if (!string.IsNullOrEmpty(invoice.Client?.Email))
                                        column.Item().Text(invoice.Client.Email);
                                });

                                row.RelativeItem().Column(column =>
                                {
                                    column.Item().AlignRight().Text("From:").Bold();
                                    column.Item().AlignRight().Text(invoice.Freelancer?.Username ?? "N/A");
                                    column.Item().AlignRight().Text(invoice.Freelancer?.Email ?? "N/A");
                                });
                            });

                            x.Item().PaddingVertical(20).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);

                            // Project info
                            x.Item().Column(column =>
                            {
                                column.Item().Text("Project Details:").Bold();
                                column.Item().Text($"Title: {invoice.Title}");
                                column.Item().Text($"Project: {invoice.Project?.Title ?? "N/A"}");
                                if (!string.IsNullOrEmpty(invoice.Description))
                                    column.Item().Text($"Description: {invoice.Description}");
                            });

                            x.Item().PaddingVertical(20);

                            // Invoice items table
                            x.Item().Table(table =>
                            {
                                table.ColumnsDefinition(columns =>
                                {
                                    columns.RelativeColumn(3);
                                    columns.RelativeColumn(1);
                                    columns.RelativeColumn(1);
                                    columns.RelativeColumn(1);
                                });

                                table.Header(header =>
                                {
                                    header.Cell().Element(CellStyle).Text("Description").Bold();
                                    header.Cell().Element(CellStyle).Text("Quantity").Bold();
                                    header.Cell().Element(CellStyle).Text("Rate").Bold();
                                    header.Cell().Element(CellStyle).Text("Total").Bold();

                                    static IContainer CellStyle(IContainer container)
                                    {
                                        return container.BorderBottom(1).BorderColor(Colors.Black).PaddingVertical(5);
                                    }
                                });

                                foreach (var item in invoice.Items)
                                {
                                    table.Cell().Element(CellStyle).Text(item.Description);
                                    table.Cell().Element(CellStyle).Text(item.Quantity.ToString("F2"));
                                    table.Cell().Element(CellStyle).Text($"${item.Rate:F2}");
                                    table.Cell().Element(CellStyle).Text($"${item.Total:F2}");

                                    static IContainer CellStyle(IContainer container)
                                    {
                                        return container.BorderBottom(1).BorderColor(Colors.Grey.Lighten2).PaddingVertical(5);
                                    }
                                }

                                // Total row
                                table.Cell().ColumnSpan(3).Element(TotalCellStyle).Text("Total Amount:").Bold();
                                table.Cell().Element(TotalCellStyle).Text($"${invoice.Amount:F2}").Bold();

                                static IContainer TotalCellStyle(IContainer container)
                                {
                                    return container.BorderTop(2).BorderColor(Colors.Black).PaddingVertical(5);
                                }
                            });

                            // Payment terms
                            x.Item().PaddingTop(30).Column(column =>
                            {
                                column.Item().Text("Payment Terms:").Bold();
                                column.Item().Text($"Due Date: {invoice.DueDate:yyyy-MM-dd}");
                                column.Item().Text("Payment is due within the specified terms.");
                            });
                        });

                    page.Footer()
                        .AlignCenter()
                        .Text(x =>
                        {
                            x.Span("Generated on ");
                            x.Span(DateTime.Now.ToString("yyyy-MM-dd HH:mm"));
                        });
                });
            });

            return document.GeneratePdf();
        }
    }
}