using Server.DTOs;

namespace Server.Services.Interfaces
{
    public interface IMessageService
    {
        // Core messaging functionality
        Task<ConversationDto> StartConversationAsync(int currentUserId, StartConversationDto dto);
        Task<MessageDto> SendMessageAsync(int currentUserId, SendMessageDto dto);
        Task<MessageDto> EditMessageAsync(int currentUserId, int messageId, EditMessageDto dto);
        Task<bool> DeleteMessageAsync(int currentUserId, int messageId);

        // Conversation management
        Task<MessagesPageDto> GetConversationMessagesAsync(int currentUserId, int conversationId, int page = 1, int pageSize = 50);
        Task<List<ConversationSummaryDto>> GetUserConversationsAsync(int currentUserId, bool includeArchived = false);
        Task<ConversationDto?> GetConversationAsync(int currentUserId, int conversationId);
        Task<bool> MarkConversationAsReadAsync(int currentUserId, int conversationId, int? lastMessageId = null);
        Task<bool> UpdateConversationSettingsAsync(int currentUserId, int conversationId, ConversationSettingsDto settings);

        // Search and statistics
        Task<MessageStatsDto> GetUserMessageStatsAsync(int currentUserId);
        Task<List<MessageDto>> SearchMessagesAsync(int currentUserId, MessageSearchDto searchDto);

        // Reactions (Instagram-like feature)
        Task<MessageDto> AddReactionAsync(int currentUserId, int messageId, string emoji);
        Task<MessageDto> RemoveReactionAsync(int currentUserId, int messageId, string emoji);
        Task<List<MessageReactionDto>> GetMessageReactionsAsync(int messageId);

        // Utility methods
        Task<bool> CanUserAccessConversationAsync(int userId, int conversationId);
        Task<bool> CanUserAccessMessageAsync(int userId, int messageId);
    }
}
