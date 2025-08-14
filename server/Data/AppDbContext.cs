using Microsoft.EntityFrameworkCore;
using Server.Models;

namespace Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<Client> Clients { get; set; }
        public DbSet<Project> Projects { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceItem> InvoiceItems { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<ProjectFile> ProjectFiles { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure decimal precision for financial data
            modelBuilder.Entity<Invoice>()
                .Property(i => i.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<InvoiceItem>()
                .Property(i => i.Rate)
                .HasPrecision(18, 2);

            modelBuilder.Entity<InvoiceItem>()
                .Property(i => i.Quantity)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(18, 2);

            // Configure relationships
            modelBuilder.Entity<Client>()
                .HasOne(c => c.Freelancer)
                .WithMany()
                .HasForeignKey(c => c.FreelancerId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Project>()
                .HasOne(p => p.Client)
                .WithMany()
                .HasForeignKey(p => p.ClientId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Project>()
                .HasIndex(p => p.Deadline);

            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.Project)
                .WithMany()
                .HasForeignKey(i => i.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.Client)
                .WithMany()
                .HasForeignKey(i => i.ClientId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Client>()
                .HasIndex(c => c.Email);

            modelBuilder.Entity<Invoice>()
                .HasOne(i => i.Freelancer)
                .WithMany()
                .HasForeignKey(i => i.FreelancerId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Invoice>()
                .HasIndex(i => new { i.FreelancerId, i.Status });

            modelBuilder.Entity<Invoice>()
                .Property(e => e.Status)
                .HasConversion<string>();

            modelBuilder.Entity<InvoiceItem>()
                .HasOne(ii => ii.Invoice)
                .WithMany(i => i.Items)
                .HasForeignKey(ii => ii.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Invoice)
                .WithMany(i => i.Payments)
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Payment>()
                .Property(e => e.Status)
                .HasConversion<string>();

            modelBuilder.Entity<ProjectFile>()
                .HasOne(pf => pf.Project)
                .WithMany()
                .HasForeignKey(pf => pf.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectFile>()
                .Property(e => e.Type)
                .HasConversion<string>();

            modelBuilder.Entity<ProjectFile>()
                .HasOne(pf => pf.UploadedBy)
                .WithMany()
                .HasForeignKey(pf => pf.UploadedById)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Username)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            // Configure unique constraints
            modelBuilder.Entity<Invoice>()
                .HasIndex(i => i.InvoiceNumber)
                .IsUnique();

            base.OnModelCreating(modelBuilder);
        }
    }
}