import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { subscribeToMessages, sendMessage, loadMoreMessages } from '../services/chatService';

const ChatScreen = () => {
  const navigate = useNavigate();
  const { currentRoom, members } = useRoom();
  const { user } = useAuth();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  // Redirect if no room selected
  useEffect(() => {
    if (!currentRoom) {
      navigate('/');
    }
  }, [currentRoom, navigate]);

  // Subscribe to messages
  useEffect(() => {
    if (!currentRoom) return;

    setLoading(true);
    const unsubscribe = subscribeToMessages(currentRoom.id, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentRoom?.id]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (!loading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      await sendMessage({
        roomId: currentRoom.id,
        senderId: user.uid,
        senderName: user.displayName || user.email?.split('@')[0] || 'User',
        text: messageText,
        type: 'user'
      });
    } catch (err) {
      console.error('Failed to send message:', err);
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore || messages.length === 0) return;

    setLoadingMore(true);
    try {
      const oldestMessage = messages[0];
      const olderMessages = await loadMoreMessages(currentRoom.id, oldestMessage.createdAt);
      
      if (olderMessages.length === 0) {
        setHasMore(false);
      } else {
        setMessages(prev => [...olderMessages, ...prev]);
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, msg) => {
    const dateKey = formatDate(msg.createdAt);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(msg);
    return groups;
  }, {});

  if (!currentRoom) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="bg-surface border-b border-divider px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 hover:bg-background rounded-full transition-colors"
        >
          <svg className="w-6 h-6 text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-text-primary truncate">{currentRoom.name}</h1>
          <p className="text-xs text-text-muted">{members.length} members</p>
        </div>
        {/* Member avatars */}
        <div className="flex -space-x-2">
          {members.slice(0, 3).map((member) => (
            <div 
              key={member.id}
              className="w-8 h-8 rounded-full bg-primary/20 border-2 border-surface flex items-center justify-center text-xs font-medium text-primary"
              title={member.name}
            >
              {member.name?.charAt(0).toUpperCase()}
            </div>
          ))}
          {members.length > 3 && (
            <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-surface flex items-center justify-center text-xs font-medium text-gray-600">
              +{members.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {/* Load More Button */}
        {hasMore && messages.length > 0 && (
          <div className="flex justify-center mb-4">
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="text-xs text-primary font-medium px-4 py-2 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors disabled:opacity-50"
            >
              {loadingMore ? 'Loading...' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-text-muted mt-3">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-text-secondary font-medium">No messages yet</p>
            <p className="text-sm text-text-muted mt-1">Start the conversation!</p>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              {/* Date Separator */}
              <div className="flex items-center justify-center my-4">
                <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full font-medium">
                  {date}
                </span>
              </div>

              {/* Messages */}
              {msgs.map((msg) => (
                <div key={msg.id}>
                  {msg.type === 'system' ? (
                    /* System Message */
                    <div className="flex justify-center my-3">
                      <div className="bg-gray-100 text-gray-600 text-sm px-4 py-2 rounded-xl max-w-[85%] text-center">
                        {msg.text}
                      </div>
                    </div>
                  ) : (
                    /* User Message */
                    <div className={`flex mb-3 ${msg.senderId === user.uid ? 'justify-end' : 'justify-start'}`}>
                      {/* Avatar for others */}
                      {msg.senderId !== user.uid && (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary mr-2 flex-shrink-0 self-end">
                          {msg.senderName?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      
                      <div className={`max-w-[75%] ${msg.senderId === user.uid ? 'order-2' : ''}`}>
                        {msg.senderId !== user.uid && (
                          <p className="text-xs text-text-muted mb-1 ml-1 font-medium">{msg.senderName}</p>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl ${
                          msg.senderId === user.uid 
                            ? 'bg-primary text-white rounded-br-md' 
                            : 'bg-surface text-text-primary rounded-bl-md shadow-sm border border-divider'
                        }`}>
                          <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                        <p className={`text-[10px] text-text-muted mt-1 ${msg.senderId === user.uid ? 'text-right mr-1' : 'ml-1'}`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-surface border-t border-divider px-4 py-3 pb-6">
        <div className="flex items-end gap-2 max-w-lg mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full bg-background rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none max-h-32 text-text-primary placeholder:text-text-muted"
              style={{ minHeight: '44px' }}
              maxLength={500}
            />
            {newMessage.length > 400 && (
              <span className={`absolute bottom-1 right-3 text-[10px] ${newMessage.length >= 500 ? 'text-error' : 'text-text-muted'}`}>
                {newMessage.length}/500
              </span>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 active:scale-95 transition-all flex-shrink-0"
          >
            {sending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatScreen;
