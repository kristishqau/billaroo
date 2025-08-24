using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    // Main conversation entity
    public class Conversation
    {
        public int Id { get; set; }

        [Required]
        public int FreelancerId { get; set; }

        [Required]
        public int ClientId { get; set; }

        public int? ProjectId { get; set; } // Optional - conversation can be project-specific

        [StringLength(200)]
        public string? Subject { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastMessageAt { get; set; }

        public bool IsActive { get; set; } = true;
        public bool IsArchived { get; set; } = false;

        // For future features
        public bool IsPinned { get; set; } = false;
        public bool IsMuted { get; set; } = false;

        // Navigation properties
        [ForeignKey("FreelancerId")]
        public virtual User Freelancer { get; set; } = null!;

        [ForeignKey("ClientId")]
        public virtual User Client { get; set; } = null!;

        [ForeignKey("ProjectId")]
        public virtual Project? Project { get; set; }

        public virtual ICollection<Message> Messages { get; set; } = new List<Message>();
        public virtual ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
    }

    // Individual message entity
    public class Message
    {
        public int Id { get; set; }

        [Required]
        public int ConversationId { get; set; }

        [Required]
        public int SenderId { get; set; }

        [Required]
        [StringLength(5000)]
        public string Content { get; set; } = string.Empty;

        public MessageType Type { get; set; } = MessageType.Text;

        // File attachment properties
        public string? AttachmentUrl { get; set; }
        public string? AttachmentName { get; set; }
        public string? AttachmentMimeType { get; set; }
        public long? AttachmentSize { get; set; }

        // Message metadata
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public DateTime? EditedAt { get; set; }
        public DateTime? DeletedAt { get; set; }

        public bool IsEdited { get; set; } = false;
        public bool IsDeleted { get; set; } = false;
        public bool IsSystem { get; set; } = false; // For system messages like "Project created"

        // Read status
        public bool IsRead { get; set; } = false;
        public DateTime? ReadAt { get; set; }

        // Reply functionality (for threading)
        public int? ReplyToMessageId { get; set; }

        // Navigation properties
        [ForeignKey("ConversationId")]
        public virtual Conversation Conversation { get; set; } = null!;

        [ForeignKey("SenderId")]
        public virtual User Sender { get; set; } = null!;

        [ForeignKey("ReplyToMessageId")]
        public virtual Message? ReplyToMessage { get; set; }

        public virtual ICollection<Message> Replies { get; set; } = new List<Message>();
        public virtual ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();
    }

    // For tracking conversation participants and their settings
    public class ConversationParticipant
    {
        public int Id { get; set; }

        [Required]
        public int ConversationId { get; set; }

        [Required]
        public int UserId { get; set; }

        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
        public DateTime? LastReadAt { get; set; }
        public DateTime? LastSeenAt { get; set; }

        // Participant-specific settings
        public bool IsMuted { get; set; } = false;
        public bool IsArchived { get; set; } = false;
        public bool IsPinned { get; set; } = false;
        public bool HasLeft { get; set; } = false;

        // Navigation properties
        [ForeignKey("ConversationId")]
        public virtual Conversation Conversation { get; set; } = null!;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
    }

    // For message reactions (future feature)
    public class MessageReaction
    {
        public int Id { get; set; }

        [Required]
        public int MessageId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [StringLength(10)]
        public string Emoji { get; set; } = string.Empty; // 👍, ❤️, 😂, etc.

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey("MessageId")]
        public virtual Message Message { get; set; } = null!;

        [ForeignKey("UserId")]
        public virtual User User { get; set; } = null!;
    }

    public enum MessageType
    {
        Text = 0,
        Image = 1,
        File = 2,
        System = 3,
        ProjectInvite = 4,
        InvoiceShare = 5
    }
}
