using System.ComponentModel.DataAnnotations;
using Server.Models;

namespace Server.DTOs
{
    // Simplified Start Conversation DTO - no more projectId requirement
    public class StartConversationDto
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int ParticipantId { get; set; }

        [Required]
        [StringLength(5000, MinimumLength = 1)]
        public required string InitialMessage { get; set; }

        [StringLength(200)]
        public string? Subject { get; set; }
        public int? ProjectId { get; set; }
    }

    // Send Message DTO
    public class SendMessageDto
    {
        [Required]
        [Range(1, int.MaxValue)]
        public int ConversationId { get; set; }

        [Required]
        [StringLength(5000)]
        public required string Content { get; set; }

        public MessageType Type { get; set; } = MessageType.Text;

        public int? ReplyToMessageId { get; set; }

        public IFormFile? Attachment { get; set; }
    }

    // Edit Message DTO
    public class EditMessageDto
    {
        [Required]
        [StringLength(5000)]
        public required string Content { get; set; }
    }

    // Mark as Read DTO
    public class MarkAsReadDto
    {
        public int? LastMessageId { get; set; }
    }

    // Conversation Settings DTO
    public class ConversationSettingsDto
    {
        public bool IsMuted { get; set; }
        public bool IsArchived { get; set; }
        public bool IsPinned { get; set; }
    }

    // Message Search DTO
    public class MessageSearchDto
    {
        public string? Query { get; set; }
        public int? ConversationId { get; set; }
        public MessageType? Type { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    // Add Reaction DTO
    public class AddReactionDto
    {
        [Required]
        [StringLength(10)]
        public required string Emoji { get; set; }
    }

    // Response DTOs
    public class ConversationDto
    {
        public int Id { get; set; }
        public int FreelancerId { get; set; }
        public int ClientId { get; set; }
        public int? ProjectId { get; set; }
        public string? Subject { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public DateTime? LastMessageAt { get; set; }
        public bool IsActive { get; set; }
        public bool IsArchived { get; set; }
        public bool IsPinned { get; set; }
        public bool IsMuted { get; set; }
        public UserSummaryDto Freelancer { get; set; } = new();
        public UserSummaryDto Client { get; set; } = new();
        public ProjectSummaryDto? Project { get; set; }
        public MessageDto? LastMessage { get; set; }
        public int UnreadCount { get; set; }
        public ParticipantStatusDto CurrentUserStatus { get; set; } = new();
    }

    public class ConversationSummaryDto
    {
        public int Id { get; set; }
        public UserSummaryDto OtherParticipant { get; set; } = new();
        public ProjectSummaryDto? Project { get; set; }
        public string? Subject { get; set; }
        public MessageDto? LastMessage { get; set; }
        public int UnreadCount { get; set; }
        public DateTime? LastActivity { get; set; }
        public bool IsPinned { get; set; }
        public bool IsMuted { get; set; }
        public bool IsArchived { get; set; }
    }

    public class MessageDto
    {
        public int Id { get; set; }
        public int ConversationId { get; set; }
        public int SenderId { get; set; }
        public string Content { get; set; } = string.Empty;
        public MessageType Type { get; set; }
        public MessageAttachmentDto? Attachment { get; set; }
        public DateTime SentAt { get; set; }
        public DateTime? EditedAt { get; set; }
        public bool IsEdited { get; set; }
        public bool IsDeleted { get; set; }
        public bool IsSystem { get; set; }
        public bool IsRead { get; set; }
        public DateTime? ReadAt { get; set; }
        public int? ReplyToMessageId { get; set; }
        public MessageDto? ReplyToMessage { get; set; }
        public UserSummaryDto Sender { get; set; } = new();
        public List<MessageReactionDto> Reactions { get; set; } = new();
        public bool IsSentByCurrentUser { get; set; }
        public MessageStatus Status { get; set; }
    }

    public class MessageAttachmentDto
    {
        public string Url { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string MimeType { get; set; } = string.Empty;
        public long Size { get; set; }
        public bool IsImage => MimeType.StartsWith("image/");
    }

    public class MessageReactionDto
    {
        public string Emoji { get; set; } = string.Empty;
        public List<UserSummaryDto> Users { get; set; } = new();
        public int Count => Users.Count;
        public bool HasCurrentUserReacted { get; set; }
    }

    public class MessagesPageDto
    {
        public List<MessageDto> Messages { get; set; } = new();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public bool HasNextPage { get; set; }
        public bool HasPreviousPage { get; set; }
        public ConversationDto Conversation { get; set; } = new();
    }

    public class MessageStatsDto
    {
        public int TotalConversations { get; set; }
        public int ActiveConversations { get; set; }
        public int UnreadConversations { get; set; }
        public int TotalMessages { get; set; }
        public int UnreadMessages { get; set; }
        public DateTime? LastActivity { get; set; }
        public List<ConversationSummaryDto> RecentConversations { get; set; } = new();
    }

    public class ParticipantStatusDto
    {
        public DateTime? LastReadAt { get; set; }
        public DateTime? LastSeenAt { get; set; }
        public bool IsMuted { get; set; }
        public bool IsArchived { get; set; }
        public bool IsPinned { get; set; }
    }

    public class UserSummaryDto
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? ProfileImageUrl { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsOnline { get; set; }
        public DateTime? LastSeenAt { get; set; }

        public string DisplayName => !string.IsNullOrEmpty(FirstName) && !string.IsNullOrEmpty(LastName)
            ? $"{FirstName} {LastName}"
            : Username;
    }

    public class ProjectSummaryDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
    }

    public enum MessageStatus
    {
        Sending,
        Sent,
        Delivered,
        Read,
        Failed
    }
}
