import { useState, useRef } from "react";
import styles from "../../pages/Messages/Messages.module.css";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import {
  Menu,
  MoreVertical,
  Phone,
  Video,
  Info
} from 'lucide-react';
import type { Conversation, Message, SendMessageData, UserSummary } from "../../pages/Messages/Messages";

type ChatAreaProps = {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (data: SendMessageData) => Promise<void>;
  onLoadMoreMessages: () => Promise<void>;
  sendingMessage: boolean;
  loadingMessages: boolean;
  hasMoreMessages: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  user: any;
  onShowSidebar: () => void;
};

export default function ChatArea({
  conversation,
  messages,
  onSendMessage,
  sendingMessage,
  loadingMessages,
  hasMoreMessages,
  messagesEndRef,
  fileInputRef,
  user,
  onShowSidebar
}: ChatAreaProps) {
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);

  const otherParticipant = user?.role === 'freelancer' 
    ? conversation.client 
    : conversation.freelancer;


  const getInitials = (user: UserSummary) => {
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  const formatLastSeen = (lastSeenAt?: string) => {
    if (!lastSeenAt) return 'Last seen unknown';
    
    const date = new Date(lastSeenAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Active now';
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    if (diffDays < 7) return `Active ${diffDays}d ago`;
    
    return `Last seen ${date.toLocaleDateString()}`;
  };

  const handleSendMessage = async (content: string, attachment?: File) => {
    if (!content.trim() && !attachment) return;

    const messageData: SendMessageData = {
      conversationId: conversation.id,
      content: content.trim(),
      type: attachment ? (attachment.type.startsWith('image/') ? 'Image' : 'File') : 'Text',
      replyToMessageId: replyingTo?.id,
      attachment
    };

    try {
      await onSendMessage(messageData);
      setReplyingTo(null); // Clear reply after sending
    } catch (err) {
      // Error is handled by parent component
      console.error("Failed to send message:", err);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <>
      {/* Chat Header */}
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderContent}>
          <div className={styles.chatParticipant}>
            <button
              className={styles.mobileMenuButton}
              onClick={onShowSidebar}
              style={{ display: 'none' }}
            >
              <Menu size={16} />
            </button>
            
            <div className={styles.participantAvatar}>
              {otherParticipant.profileImageUrl ? (
                <img 
                  src={otherParticipant.profileImageUrl} 
                  alt={otherParticipant.displayName}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                getInitials(otherParticipant)
              )}
            </div>
            
            <div className={styles.chatParticipantInfo}>
              <h2 className={styles.chatParticipantName}>
                {otherParticipant.displayName}
              </h2>
              <p className={styles.chatParticipantStatus}>
                {otherParticipant.isOnline && <span className={styles.onlineIndicator} />}
                {otherParticipant.isOnline ? 'Online' : formatLastSeen(otherParticipant.lastSeenAt)}
                {conversation.project && (
                  <span style={{ marginLeft: '0.5rem' }}>
                    • 📁 {conversation.project.title}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className={styles.chatActions}>
            <button className={styles.chatActionButton} title="Voice Call">
              <Phone size={18} />
            </button>
            <button className={styles.chatActionButton} title="Video Call">
              <Video size={18} />
            </button>
            <button className={styles.chatActionButton} title="Conversation Info">
              <Info size={18} />
            </button>
            <button className={styles.chatActionButton} title="More Options">
              <MoreVertical size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className={styles.messagesArea}
        ref={messagesAreaRef}
      >
        {/* Load More Messages Indicator */}
        {loadingMessages && hasMoreMessages && (
          <div className={styles.messagesLoading} style={{
            padding: '1rem',
            textAlign: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            marginBottom: '1rem'
          }}>
            <div className={styles.spinner} style={{ 
              width: '20px', 
              height: '20px', 
              margin: '0 auto 0.5rem' 
            }}></div>
            <span style={{ 
              fontSize: '0.875rem', 
              color: '#94a3b8' 
            }}>
              Loading more messages...
            </span>
          </div>
        )}

        {/* No More Messages Indicator */}
        {!hasMoreMessages && messages.length > 0 && (
          <div style={{
            textAlign: 'center',
            padding: '1rem',
            color: '#94a3b8',
            fontSize: '0.875rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            marginBottom: '1rem'
          }}>
            Beginning of conversation
          </div>
        )}

        <MessageList
          messages={messages}
          currentUserId={user?.id}
          onReply={handleReply}
          conversation={conversation}
        />
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className={styles.messageInputArea}>
        {replyingTo && (
          <div className={styles.replyingTo}>
            <div className={styles.replyingToContent}>
              <div className={styles.replyingToLabel}>
                Replying to {replyingTo.sender.displayName}
              </div>
              <p className={styles.replyingToText}>
                {replyingTo.isDeleted 
                  ? "This message was deleted"
                  : replyingTo.type === 'Image' 
                    ? "📷 Image"
                    : replyingTo.type === 'File'
                      ? "📎 File"
                      : replyingTo.content
                }
              </p>
            </div>
            <button
              className={styles.cancelReply}
              onClick={handleCancelReply}
              title="Cancel reply"
            >
              ×
            </button>
          </div>
        )}

        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={sendingMessage}
          fileInputRef={fileInputRef}
          placeholder={`Message ${otherParticipant.displayName}...`}
        />
      </div>
    </>
  );
}