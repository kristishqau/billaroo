import { useState, useEffect, useRef } from "react";
import styles from "./Messages.module.css";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar/Navbar";
import ConversationList from "../../components/Messages/ConversationList";
import ChatArea from "../../components/Messages/ChatArea";
import {
  MessageCircle,
  Menu
} from 'lucide-react';
import axios from "../../api/axios";

export type UserSummary = {
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

export type ProjectSummary = {
  id: number;
  title: string;
  description?: string;
};

export type MessageAttachment = {
  url: string;
  name: string;
  mimeType: string;
  size: number;
  isImage: boolean;
};

export type MessageReaction = {
  emoji: string;
  users: UserSummary[];
  count: number;
  hasCurrentUserReacted: boolean;
};

export type Message = {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  type: 'Text' | 'Image' | 'File';
  attachment?: MessageAttachment;
  sentAt: string;
  editedAt?: string;
  isEdited: boolean;
  isDeleted: boolean;
  isSystem: boolean;
  isRead: boolean;
  readAt?: string;
  replyToMessageId?: number;
  replyToMessage?: Message;
  sender: UserSummary;
  reactions: MessageReaction[];
  isSentByCurrentUser: boolean;
  status: 'Sending' | 'Sent' | 'Delivered' | 'Read' | 'Failed';
};

export type ConversationSummary = {
  id: number;
  otherParticipant: UserSummary;
  project?: ProjectSummary;
  subject?: string;
  lastMessage?: Message;
  unreadCount: number;
  lastActivity?: string;
  isPinned: boolean;
  isMuted: boolean;
  isArchived: boolean;
};

export type Conversation = {
  id: number;
  freelancerId: number;
  clientId: number;
  projectId?: number;
  subject?: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
  isActive: boolean;
  isArchived: boolean;
  isPinned: boolean;
  isMuted: boolean;
  freelancer: UserSummary;
  client: UserSummary;
  project?: ProjectSummary;
  lastMessage?: Message;
  unreadCount: number;
};

export type MessagesPage = {
  messages: Message[];
  totalCount: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  conversation: Conversation;
};

export type SendMessageData = {
  conversationId: number;
  content: string;
  type?: 'Text' | 'Image' | 'File';
  replyToMessageId?: number;
  attachment?: File;
};

export type StartConversationData = {
  participantId: number;
  initialMessage: string;
  subject?: string;
};

export default function Messages() {
  const { user, logout } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<'all' | 'unread' | 'archived'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  
  // Refs for auto-scroll and file input
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id, 1, true);
    }
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get<ConversationSummary[]>("/Messages/conversations", {
        params: { includeArchived: filter === 'archived' }
      });
      setConversations(response.data);
    } catch (err: any) {
      console.error("Fetch conversations error:", err);
      setError("Failed to load conversations");
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: number, pageNum: number = 1, reset: boolean = false) => {
    try {
      if (reset) {
        setLoadingMessages(true);
      } else {
        setFetchingMore(true);
      }
      
      const response = await axios.get<MessagesPage>(`/Messages/conversations/${conversationId}/messages`, {
        params: {
          page: pageNum,
          pageSize: 50
        }
      });

      if (reset) {
        setMessages(response.data.messages);
        setSelectedConversation(response.data.conversation);
      } else {
        // Prepend older messages for pagination (avoid duplicates)
        setMessages(prev => {
          const newMessages = response.data.messages.filter(
            newMsg => !prev.some(existingMsg => existingMsg.id === newMsg.id)
          );
          return [...newMessages, ...prev];
        });
      }

      setPage(pageNum);
      setHasMoreMessages(response.data.hasNextPage);

      // Mark conversation as read only when initially loading
      if (reset) {
        await markConversationAsRead(conversationId);
      }
    } catch (err: any) {
      console.error("Fetch messages error:", err);
      setError("Failed to load messages");
    } finally {
      if (reset) {
        setLoadingMessages(false);
      } else {
        setFetchingMore(false);
      }
    }
  };

  const sendMessage = async (data: SendMessageData) => {
    try {
      setSendingMessage(true);
      setError("");

      const formData = new FormData();
      formData.append('conversationId', data.conversationId.toString());
      formData.append('content', data.content);
      formData.append('type', data.type || 'Text');
      
      if (data.replyToMessageId) {
        formData.append('replyToMessageId', data.replyToMessageId.toString());
      }
      
      if (data.attachment) {
        formData.append('attachment', data.attachment);
      }

      const response = await axios.post<Message>("/Messages/messages", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Add the new message to the list
      setMessages(prev => [...prev, response.data]);

      // Update the conversation's last message in the sidebar
      setConversations(prev =>
        prev.map(conv =>
          conv.id === data.conversationId
            ? {
                ...conv,
                lastMessage: response.data,
                lastActivity: response.data.sentAt,
                unreadCount: 0 // Reset since we sent the message
              }
            : conv
        )
      );

      // Move the conversation to the top of the list
      setConversations(prev => {
        const updated = [...prev];
        const convIndex = updated.findIndex(c => c.id === data.conversationId);
        if (convIndex > 0) {
          const [conversation] = updated.splice(convIndex, 1);
          updated.unshift(conversation);
        }
        return updated;
      });

    } catch (err: any) {
      console.error("Send message error:", err);
      setError(err.response?.data?.message || "Failed to send message");
      throw err; // Re-throw so the input component can handle it
    } finally {
      setSendingMessage(false);
    }
  };

  const markConversationAsRead = async (conversationId: number) => {
    try {
      await axios.post(`/Messages/conversations/${conversationId}/mark-read`);
      
      // Update the conversation's unread count
      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (err: any) {
      console.error("Mark as read error:", err);
      // Don't show error to user for this operation
    }
  };

  const startNewConversation = async (data: { participantId: number; initialMessage: string; subject?: string }) => {
    try {
      console.log('Starting conversation with data:', data); // Debug log
      
      const response = await axios.post<Conversation>("/Messages/conversations", {
        participantId: data.participantId,
        initialMessage: data.initialMessage,
        subject: data.subject
      });
      
      console.log('Conversation started successfully:', response.data); // Debug log
      
      // Add to conversations list
      const newConversation: ConversationSummary = {
        id: response.data.id,
        otherParticipant: user?.id === response.data.freelancerId ? response.data.client : response.data.freelancer,
        project: response.data.project,
        subject: response.data.subject,
        lastMessage: response.data.lastMessage,
        unreadCount: 0,
        lastActivity: response.data.lastMessageAt || response.data.createdAt,
        isPinned: false,
        isMuted: false,
        isArchived: false
      };
      
      setConversations(prev => [newConversation, ...prev]);
      setSelectedConversation(response.data);
      
      if (response.data.lastMessage) {
        setMessages([response.data.lastMessage]);
      }
      
      setSidebarOpen(false);
      return response.data;
    } catch (err: any) {
      console.error("Start conversation error:", err);
      console.error("Error response:", err.response?.data); // Debug log
      
      // Provide more specific error messages
      let errorMessage = "Failed to start conversation";
      if (err.response?.status === 400) {
        errorMessage = err.response.data?.message || err.response.data || "Invalid request data";
      } else if (err.response?.status === 401) {
        errorMessage = "You need to be logged in to start a conversation";
        logout();
      } else if (err.response?.status === 404) {
        errorMessage = "User not found. Please try again.";
      } else if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      }
      
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const loadMoreMessages = async () => {
    if (!selectedConversation || !hasMoreMessages || loadingMessages || fetchingMore) {
      return;
    }
    
    await fetchMessages(selectedConversation.id, page + 1, false);
  };

  const filteredConversations = conversations.filter(conv => {
    // Apply filter
    if (filter === 'unread' && conv.unreadCount === 0) return false;
    if (filter === 'archived' && !conv.isArchived) return false;
    if (filter === 'all' && conv.isArchived) return false;

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        conv.otherParticipant.displayName.toLowerCase().includes(searchLower) ||
        conv.subject?.toLowerCase().includes(searchLower) ||
        conv.project?.title.toLowerCase().includes(searchLower) ||
        conv.lastMessage?.content.toLowerCase().includes(searchLower)
      );
    }

    return true;
  });

  const handleConversationSelect = (conversation: ConversationSummary) => {
    // Find the full conversation or create a minimal one
    const fullConversation: Conversation = {
      id: conversation.id,
      freelancerId: user?.role === 'freelancer' ? user.id : conversation.otherParticipant.id,
      clientId: user?.role === 'client' ? user.id : conversation.otherParticipant.id,
      projectId: conversation.project?.id,
      subject: conversation.subject,
      createdAt: '', // Will be loaded when fetching messages
      updatedAt: '',
      lastMessageAt: conversation.lastActivity,
      isActive: true,
      isArchived: conversation.isArchived,
      isPinned: conversation.isPinned,
      isMuted: conversation.isMuted,
      freelancer: user?.role === 'freelancer' 
        ? { 
            id: user.id, 
            username: user.username, 
            displayName: `${user.firstName} ${user.lastName}`.trim() || user.username,
            role: user.role,
            isOnline: true
          } as UserSummary
        : conversation.otherParticipant,
      client: user?.role === 'client'
        ? { 
            id: user.id, 
            username: user.username, 
            displayName: `${user.firstName} ${user.lastName}`.trim() || user.username,
            role: user.role,
            isOnline: true
          } as UserSummary
        : conversation.otherParticipant,
      project: conversation.project,
      lastMessage: conversation.lastMessage,
      unreadCount: conversation.unreadCount
    };

    setSelectedConversation(fullConversation);
    setSidebarOpen(false); // Close sidebar on mobile
  };

  if (loading) {
    return (
      <div className={styles.messagesContainer}>
        <Navbar variant="dashboard" />
        <div className={styles.messagesContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading conversations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.messagesContainer}>
      <Navbar variant="dashboard" />

      <div className={styles.messagesContent}>
        {/* Mobile Sidebar Overlay */}
        <div 
          className={`${styles.sidebarOverlay} ${sidebarOpen ? styles.open : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Conversations Sidebar */}
        <div className={`${styles.messagesSidebar} ${sidebarOpen ? styles.open : ''}`}>
          <ConversationList
            conversations={filteredConversations}
            selectedConversationId={selectedConversation?.id}
            onConversationSelect={handleConversationSelect}
            onStartNewConversation={startNewConversation}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filter={filter}
            onFilterChange={setFilter}
            loading={loading}
            user={user}
          />
        </div>

        {/* Main Chat Area */}
        <div className={styles.chatArea}>
          {selectedConversation ? (
            <ChatArea
              conversation={selectedConversation}
              messages={messages}
              onSendMessage={sendMessage}
              onLoadMoreMessages={loadMoreMessages}
              sendingMessage={sendingMessage}
              loadingMessages={loadingMessages || fetchingMore}
              hasMoreMessages={hasMoreMessages}
              messagesEndRef={messagesEndRef}
              fileInputRef={fileInputRef}
              user={user}
              onShowSidebar={() => setSidebarOpen(true)}
            />
          ) : (
            <div className={styles.emptyChatArea}>
              <div className={styles.emptyChatIcon}>
                <MessageCircle size={60} />
              </div>
              <h2 className={styles.emptyChatTitle}>
                Select a conversation
              </h2>
              <p className={styles.emptyChatDescription}>
                Choose a conversation from the sidebar to start messaging, or create a new conversation to connect with your {user?.role === 'freelancer' ? 'clients' : 'freelancers'}.
              </p>
            </div>
          )}
        </div>

        {/* Mobile Menu Button - Only show when sidebar is closed */}
        {!sidebarOpen && (
          <button
            className={styles.mobileMenuButton}
            onClick={() => setSidebarOpen(true)}
            style={{
              position: 'fixed',
              top: '90px',
              left: '1rem',
              zIndex: 5,
              display: 'none' // Will be shown via CSS media queries
            }}
          >
            <Menu size={16} />
            Messages
          </button>
        )}

        {error && (
          <div className={styles.errorBanner}>
            <span>{error}</span>
            <button onClick={() => setError("")}>×</button>
          </div>
        )}
      </div>
    </div>
  );
}