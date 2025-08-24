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
        public DbSet<UserSkill> UserSkills { get; set; }
        public DbSet<LoginHistory> LoginHistories { get; set; }
        public DbSet<SecurityAuditLog> SecurityAuditLogs { get; set; }
        public DbSet<EmailTemplate> EmailTemplates { get; set; }
        public DbSet<Conversation> Conversations { get; set; }
        public DbSet<Message> Messages { get; set; }
        public DbSet<ConversationParticipant> ConversationParticipants { get; set; }
        public DbSet<MessageReaction> MessageReactions { get; set; }

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

            modelBuilder.Entity<UserSkill>()
                .HasOne(us => us.User)
                .WithMany(u => u.Skills)
                .HasForeignKey(us => us.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserSkill>()
                .HasIndex(us => new { us.UserId, us.SkillName })
                .IsUnique();

            modelBuilder.Entity<UserSkill>()
                .Property(us => us.ProficiencyLevel)
                .HasDefaultValue(3);

            // LoginHistory configuration
            modelBuilder.Entity<LoginHistory>()
                .HasOne(lh => lh.User)
                .WithMany(u => u.LoginHistory)
                .HasForeignKey(lh => lh.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<LoginHistory>()
                .HasIndex(lh => lh.LoginTime);

            modelBuilder.Entity<LoginHistory>()
                .HasIndex(lh => new { lh.UserId, lh.LoginTime });

            modelBuilder.Entity<LoginHistory>()
                .Property(lh => lh.IpAddress)
                .HasMaxLength(45); // For IPv6

            modelBuilder.Entity<LoginHistory>()
                .Property(lh => lh.UserAgent)
                .HasMaxLength(500);

            modelBuilder.Entity<LoginHistory>()
                .Property(lh => lh.DeviceInfo)
                .HasMaxLength(200);

            modelBuilder.Entity<LoginHistory>()
                .Property(lh => lh.Location)
                .HasMaxLength(100);

            // SecurityAuditLog configuration
            modelBuilder.Entity<SecurityAuditLog>()
                .HasOne(sal => sal.User)
                .WithMany()
                .HasForeignKey(sal => sal.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<SecurityAuditLog>()
                .HasIndex(sal => sal.Timestamp);

            modelBuilder.Entity<SecurityAuditLog>()
                .HasIndex(sal => new { sal.UserId, sal.Timestamp });

            modelBuilder.Entity<SecurityAuditLog>()
                .HasIndex(sal => sal.Action);

            modelBuilder.Entity<SecurityAuditLog>()
                .Property(sal => sal.Action)
                .HasMaxLength(50);

            modelBuilder.Entity<SecurityAuditLog>()
                .Property(sal => sal.IpAddress)
                .HasMaxLength(45);

            modelBuilder.Entity<SecurityAuditLog>()
                .Property(sal => sal.UserAgent)
                .HasMaxLength(500);

            // EmailTemplate configuration
            modelBuilder.Entity<EmailTemplate>()
                .HasIndex(et => et.TemplateType)
                .IsUnique();

            modelBuilder.Entity<EmailTemplate>()
                .Property(et => et.TemplateType)
                .HasMaxLength(50);

            modelBuilder.Entity<EmailTemplate>()
                .Property(et => et.Subject)
                .HasMaxLength(200);

            // User entity additional configurations
            modelBuilder.Entity<User>()
                .Property(u => u.PhoneNumber)
                .HasMaxLength(20);

            modelBuilder.Entity<User>()
                .Property(u => u.PhoneVerificationCode)
                .HasMaxLength(10);

            modelBuilder.Entity<User>()
                .Property(u => u.TwoFactorSecret)
                .HasMaxLength(100);

            modelBuilder.Entity<User>()
                .Property(u => u.VerificationStatus)
                .HasMaxLength(20)
                .HasDefaultValue("Unverified");

            modelBuilder.Entity<User>()
                .Property(u => u.JobTitle)
                .HasMaxLength(100);

            modelBuilder.Entity<User>()
                .Property(u => u.Company)
                .HasMaxLength(100);

            modelBuilder.Entity<User>()
                .Property(u => u.Bio)
                .HasMaxLength(1000);

            modelBuilder.Entity<User>()
                .Property(u => u.TimeZone)
                .HasMaxLength(50);

            modelBuilder.Entity<User>()
                .Property(u => u.Street)
                .HasMaxLength(200);

            modelBuilder.Entity<User>()
                .Property(u => u.City)
                .HasMaxLength(100);

            modelBuilder.Entity<User>()
                .Property(u => u.State)
                .HasMaxLength(50);

            modelBuilder.Entity<User>()
                .Property(u => u.PostalCode)
                .HasMaxLength(20);

            modelBuilder.Entity<User>()
                .Property(u => u.Country)
                .HasMaxLength(50);

            // Add indexes for better performance
            modelBuilder.Entity<User>()
                .HasIndex(u => u.PhoneNumber);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.IsDeleted);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.VerificationStatus);

            modelBuilder.Entity<User>()
                .HasIndex(u => u.TwoFactorEnabled);

            // Global query filter for soft delete
            modelBuilder.Entity<User>()
                .HasQueryFilter(u => !u.IsDeleted);

            #region Message System Configuration

            // Conversation Configuration
            modelBuilder.Entity<Conversation>(entity =>
            {
                entity.HasKey(c => c.Id);

                entity.Property(c => c.Subject)
                    .HasMaxLength(200);

                entity.HasIndex(c => new { c.FreelancerId, c.ClientId });
                entity.HasIndex(c => c.ProjectId);
                entity.HasIndex(c => c.LastMessageAt);
                entity.HasIndex(c => c.CreatedAt);

                // Relationships
                entity.HasOne(c => c.Freelancer)
                    .WithMany()
                    .HasForeignKey(c => c.FreelancerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.Client)
                    .WithMany()
                    .HasForeignKey(c => c.ClientId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(c => c.Project)
                    .WithMany()
                    .HasForeignKey(c => c.ProjectId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasMany(c => c.Messages)
                    .WithOne(m => m.Conversation)
                    .HasForeignKey(m => m.ConversationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(c => c.Participants)
                    .WithOne(p => p.Conversation)
                    .HasForeignKey(p => p.ConversationId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Message Configuration
            modelBuilder.Entity<Message>(entity =>
            {
                entity.HasKey(m => m.Id);

                entity.Property(m => m.Content)
                    .IsRequired()
                    .HasMaxLength(5000);

                entity.Property(m => m.AttachmentName)
                    .HasMaxLength(255);

                entity.Property(m => m.AttachmentMimeType)
                    .HasMaxLength(100);

                entity.Property(m => m.AttachmentUrl)
                    .HasMaxLength(500);

                // Indexes for performance
                entity.HasIndex(m => new { m.ConversationId, m.SentAt });
                entity.HasIndex(m => m.SenderId);
                entity.HasIndex(m => new { m.ConversationId, m.IsRead });
                entity.HasIndex(m => m.ReplyToMessageId);

                // Relationships
                entity.HasOne(m => m.Conversation)
                    .WithMany(c => c.Messages)
                    .HasForeignKey(m => m.ConversationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(m => m.Sender)
                    .WithMany()
                    .HasForeignKey(m => m.SenderId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(m => m.ReplyToMessage)
                    .WithMany(m => m.Replies)
                    .HasForeignKey(m => m.ReplyToMessageId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasMany(m => m.Reactions)
                    .WithOne(r => r.Message)
                    .HasForeignKey(r => r.MessageId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // ConversationParticipant Configuration
            modelBuilder.Entity<ConversationParticipant>(entity =>
            {
                entity.HasKey(p => p.Id);

                // Unique constraint: one participant record per user per conversation
                entity.HasIndex(p => new { p.ConversationId, p.UserId })
                    .IsUnique();

                entity.HasIndex(p => p.UserId);
                entity.HasIndex(p => new { p.UserId, p.LastReadAt });

                // Relationships
                entity.HasOne(p => p.Conversation)
                    .WithMany(c => c.Participants)
                    .HasForeignKey(p => p.ConversationId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(p => p.User)
                    .WithMany()
                    .HasForeignKey(p => p.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // MessageReaction Configuration
            modelBuilder.Entity<MessageReaction>(entity =>
            {
                entity.HasKey(r => r.Id);

                entity.Property(r => r.Emoji)
                    .IsRequired()
                    .HasMaxLength(10);

                // Unique constraint: one reaction per user per message per emoji
                entity.HasIndex(r => new { r.MessageId, r.UserId, r.Emoji })
                    .IsUnique();

                entity.HasIndex(r => r.MessageId);
                entity.HasIndex(r => r.UserId);

                // Relationships
                entity.HasOne(r => r.Message)
                    .WithMany(m => m.Reactions)
                    .HasForeignKey(r => r.MessageId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(r => r.User)
                    .WithMany()
                    .HasForeignKey(r => r.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            #endregion

            base.OnModelCreating(modelBuilder);
        }
    }
}
