import { useState } from "react";
import {
  Search,
  MessageCircle,
  Pin,
  VolumeX
} from 'lucide-react';

// Import the improved conversation starter
import ConversationStarter from "./ConversationStarter";
import type { ConversationSummary, StartConversationData } from "../../pages/Messages/Messages";

type UserSummary = {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: string;
  isOnline: boolean;
  lastSeenAt?: string;
  displayName: string;
};

type ConversationListProps = {
  conversations: ConversationSummary[];
  selectedConversationId?: number;
  onConversationSelect: (conversation: ConversationSummary) => void;
  onStartNewConversation: (data: StartConversationData) => Promise<any>;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filter: 'all' | 'unread' | 'archived';
  onFilterChange: (filter: 'all' | 'unread' | 'archived') => void;
  loading: boolean;
  user: any;
};

const styles = {
  sidebarHeader: {
    padding: '1.5rem 1.5rem 1rem',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
  },
  sidebarTitle: {
    color: '#e2e8f0',
    fontSize: '1.25rem',
    fontWeight: 700,
    marginBottom: '1.5rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  searchContainer: {
    position: 'relative' as const,
    marginBottom: '1rem'
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#94a3b8',
    pointerEvents: 'none' as const
  },
  searchInput: {
    width: '100%',
    background: '#334155',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
    color: '#e2e8f0',
    fontSize: '0.9rem',
    outline: 'none'
  },
  conversationFilters: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  filterButton: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '0.5rem 0.75rem',
    color: '#94a3b8',
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  filterButtonActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: '1px solid transparent',
    color: '#ffffff'
  },
  conversationsList: {
    padding: '20px 1.5rem 1.5rem',
    height: 'calc(100vh - 300px)',
    overflowY: 'auto' as const
  },
  emptyConversations: {
    textAlign: 'center' as const,
    padding: '3rem 1rem',
    color: '#94a3b8'
  },
  emptyIcon: {
    marginBottom: '1rem',
    opacity: 0.6
  },
  emptyTitle: {
    color: '#e2e8f0',
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '0.5rem'
  },
  emptyDescription: {
    fontSize: '0.9rem',
    lineHeight: '1.4',
    margin: 0
  },
  conversationItem: {
    padding: '1rem',
    borderRadius: '12px',
    cursor: 'pointer',
    marginBottom: '0.5rem',
    transition: 'all 0.2s ease',
    border: '1px solid transparent'
  },
  conversationItemHover: {
    background: 'rgba(255, 255, 255, 0.05)'
  },
  conversationItemActive: {
    background: 'rgba(102, 126, 234, 0.1)',
    border: '1px solid rgba(102, 126, 234, 0.3)'
  },
  conversationItemUnread: {
    background: 'rgba(102, 126, 234, 0.05)',
    borderLeft: '3px solid #667eea'
  },
  conversationHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem'
  },
  participantInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    flex: 1,
    minWidth: 0
  },
  participantAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ffffff',
    fontSize: '0.9rem',
    fontWeight: 600,
    flexShrink: 0,
    position: 'relative' as const
  },
  participantName: {
    color: '#e2e8f0',
    fontSize: '0.95rem',
    fontWeight: 600,
    marginBottom: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  },
  participantRole: {
    color: '#94a3b8',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    textTransform: 'capitalize' as const
  },
  conversationMeta: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '0.25rem'
  },
  lastMessageTime: {
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontWeight: 500
  },
  unreadBadge: {
    background: '#667eea',
    color: '#ffffff',
    borderRadius: '50%',
    minWidth: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 600
  },
  lastMessage: {
    color: '#94a3b8',
    fontSize: '0.85rem',
    lineHeight: '1.3',
    marginBottom: '0.5rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const
  },
  projectContext: {
    background: 'rgba(102, 126, 234, 0.1)',
    border: '1px solid rgba(102, 126, 234, 0.2)',
    borderRadius: '6px',
    padding: '0.5rem',
    marginTop: '0.5rem'
  },
  projectTitle: {
    color: '#667eea',
    fontSize: '0.8rem',
    fontWeight: 500,
    margin: 0
  },
  onlineIndicator: {
    width: '8px',
    height: '8px',
    background: '#10b981',
    borderRadius: '50%',
    display: 'inline-block'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1rem',
    color: '#94a3b8'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid rgba(102, 126, 234, 0.3)',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem'
  },
  loadingText: {
    fontSize: '0.9rem',
    margin: 0
  }
};

export default function ConversationList({
  conversations,
  selectedConversationId,
  onConversationSelect,
  onStartNewConversation,
  searchTerm,
  onSearchChange,
  filter,
  onFilterChange,
  loading
}: ConversationListProps) {
  const [hoveredItem, setHoveredItem] = useState<number | null>(null);

  const formatLastMessageTime = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const getInitials = (user: UserSummary) => {
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    return user.username.slice(0, 2).toUpperCase();
  };

  const truncateMessage = (content: string, maxLength: number = 60) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading conversations...</p>
      </div>
    );
  }

  return (
    <>
      <div style={styles.sidebarHeader}>
        <h1 style={styles.sidebarTitle}>
          <MessageCircle size={24} />
          Messages
        </h1>

        <div style={styles.searchContainer}>
          <Search size={16} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            style={styles.searchInput}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          />
        </div>

        <div style={styles.conversationFilters}>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'all' ? styles.filterButtonActive : {})
            }}
            onClick={() => onFilterChange('all')}
          >
            All
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'unread' ? styles.filterButtonActive : {})
            }}
            onClick={() => onFilterChange('unread')}
          >
            Unread
          </button>
          <button
            style={{
              ...styles.filterButton,
              ...(filter === 'archived' ? styles.filterButtonActive : {})
            }}
            onClick={() => onFilterChange('archived')}
          >
            Archived
          </button>
        </div>

        {/* Improved Conversation Starter */}
        <ConversationStarter
          onStartConversation={onStartNewConversation}
          isInSidebar={true}
        />
      </div>

      <div style={styles.conversationsList}>
        {conversations.length === 0 ? (
          <div style={styles.emptyConversations}>
            <div style={styles.emptyIcon}>
              <MessageCircle size={40} />
            </div>
            <h3 style={styles.emptyTitle}>
              {searchTerm || filter !== 'all' ? "No conversations found" : "No messages yet"}
            </h3>
            <p style={styles.emptyDescription}>
              {searchTerm || filter !== 'all'
                ? "Try adjusting your search or filters."
                : "Start your first conversation using the 'New Message' button above."
              }
            </p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const isActive = selectedConversationId === conversation.id;
            const isHovered = hoveredItem === conversation.id;
            const isUnread = conversation.unreadCount > 0;

            return (
              <div
                key={conversation.id}
                style={{
                  ...styles.conversationItem,
                  ...(isActive ? styles.conversationItemActive : {}),
                  ...(isUnread ? styles.conversationItemUnread : {}),
                  ...(isHovered && !isActive ? styles.conversationItemHover : {})
                }}
                onClick={() => onConversationSelect(conversation)}
                onMouseEnter={() => setHoveredItem(conversation.id)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div style={styles.conversationHeader}>
                  <div style={styles.participantInfo}>
                    <div style={styles.participantAvatar}>
                      {conversation.otherParticipant.profileImageUrl ? (
                        <img 
                          src={conversation.otherParticipant.profileImageUrl} 
                          alt={conversation.otherParticipant.displayName}
                          style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        getInitials(conversation.otherParticipant)
                      )}
                      {conversation.otherParticipant.isOnline && (
                        <div style={{
                          position: 'absolute',
                          bottom: '2px',
                          right: '2px',
                          width: '12px',
                          height: '12px',
                          background: '#10b981',
                          borderRadius: '50%',
                          border: '2px solid #1e293b'
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <h4 style={styles.participantName}>
                        {conversation.otherParticipant.displayName}
                        {conversation.isPinned && (
                          <Pin size={12} style={{ opacity: 0.7 }} />
                        )}
                        {conversation.isMuted && (
                          <VolumeX size={12} style={{ opacity: 0.7 }} />
                        )}
                      </h4>
                      <p style={styles.participantRole}>
                        {conversation.otherParticipant.role}
                        {conversation.otherParticipant.isOnline && (
                          <>
                            <span style={styles.onlineIndicator} />
                            Online
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div style={styles.conversationMeta}>
                    <span style={styles.lastMessageTime}>
                      {formatLastMessageTime(conversation.lastActivity)}
                    </span>
                    {conversation.unreadCount > 0 && (
                      <span style={styles.unreadBadge}>
                        {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>

                {conversation.lastMessage && (
                  <p style={styles.lastMessage}>
                    {conversation.lastMessage.isSentByCurrentUser ? 'You: ' : ''}
                    {conversation.lastMessage.isDeleted 
                      ? "This message was deleted"
                      : conversation.lastMessage.type === 'Image' 
                        ? "📷 Image"
                        : conversation.lastMessage.type === 'File'
                          ? "📎 File"
                          : truncateMessage(conversation.lastMessage.content)
                    }
                  </p>
                )}

                {conversation.project && (
                  <div style={styles.projectContext}>
                    <h5 style={styles.projectTitle}>
                      📁 {conversation.project.title}
                    </h5>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}