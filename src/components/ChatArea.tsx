'use client';

import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import Image from 'next/image';
import React, { memo } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp;
}

interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Timestamp;
  isGroup?: boolean;
  name?: string;
  ownerId?: string;
}

interface Notification {
  chatId: string;
  senderName: string;
  content: string;
  chatName: string;
  time: string;
}

interface ChatAreaProps {
  messages: Message[];
  selectedChat: string | null;
  chats: Chat[];
  users: User[];
  user: FirebaseUser | null;
  newMessage: string;
  onSendMessage: (e: React.FormEvent) => void;
  onMessageChange: (value: string) => void;
  onToggleMobileSidebar: () => void;
  debugLog?: React.ReactNode;
  onDeleteMessage: (messageId: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  notifications: Notification[];
  showNotifications: boolean;
  onToggleNotifications: () => void;
  onNotificationClick: (chatId: string) => void;
}

export default function ChatArea({
  messages,
  selectedChat,
  chats,
  users,
  user,
  newMessage,
  onSendMessage,
  onMessageChange,
  onToggleMobileSidebar,
  debugLog,
  onDeleteMessage,
  onEditMessage,
  notifications,
  showNotifications,
  onToggleNotifications,
  onNotificationClick
}: ChatAreaProps) {
  // REMOVE notificationRef, notification UI, and notification logic
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState('');

  const handleEdit = (messageId: string, content: string) => {
    setEditingId(messageId);
    setEditValue(content);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onEditMessage(editingId, editValue);
      setEditingId(null);
      setEditValue('');
    }
  };

  const selectedChatObj = chats.find(chat => chat.id === selectedChat);

  return (
    <div className="flex-1 flex flex-col relative">
      {debugLog}
      {/* Top Bar with Notification Bell */}
      <div className="flex items-center justify-between px-8 py-4 bg-white/10 mx-4 backdrop-blur-lg shadow-lg rounded-b-3xl rounded-t-3xl border-b border-blue-400/40">
        <div className="flex items-center gap-3">
          {/* Hamburger menu for mobile */}
          <button
            onClick={onToggleMobileSidebar}
            className="lg:hidden p-2 text-blue-300 hover:bg-blue-400/20 rounded-full transition mr-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
          {/* BanterBox Logo and Text */}
          <div className="flex items-center gap-2">
            <span className="inline-block">
              <svg width="36" height="36" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <ellipse cx="28" cy="28" rx="26" ry="22" fill="#6366F1" />
                <ellipse cx="28" cy="28" rx="22" ry="18" fill="#A5B4FC" />
                <path d="M16 38c0-2.21 5.82-4 13-4s13 1.79 13 4v2c0 2.21-5.82 4-13 4s-13-1.79-13-4v-2z" fill="#6366F1" />
                <ellipse cx="22" cy="26" rx="2.5" ry="2.5" fill="#312E81" />
                <ellipse cx="34" cy="26" rx="2.5" ry="2.5" fill="#312E81" />
                <path d="M24 32c1.5 1 6.5 1 8 0" stroke="#312E81" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-wide drop-shadow-lg">BanterBox</h1>
          </div>
        </div>
        {/* Notification Bell */}
        <div className="relative">
          <button
            className="relative p-2 rounded-full bg-blue-900/60 hover:bg-blue-700/80 transition shadow-lg"
            onClick={onToggleNotifications}
          >
            <BellIcon className="w-7 h-7 text-white" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 animate-pulse shadow-lg">
                {notifications.length}
              </span>
            )}
          </button>
          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white/90 rounded-xl shadow-2xl z-[99999] border border-blue-400/40">
              <div className="p-4 border-b border-blue-400/20 font-bold text-blue-900 flex items-center justify-between">
                <span>Notifications</span>
                <button
                  onClick={onToggleNotifications}
                  className="p-1 hover:bg-blue-100 rounded-full transition"
                >
                  <XMarkIcon className="w-5 h-5 text-white" />
                </button>
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-gray-500">No new messages</div>
              ) : (
                notifications.slice(0, 5).map((notif, idx) => (
                  <div
                    key={idx}
                    className="p-4 hover:bg-blue-100/60 cursor-pointer border-b border-blue-400/10 last:border-b-0 transition-colors"
                    onClick={() => onNotificationClick(notif.chatId)}
                  >
                    <div className="font-semibold text-blue-800">{notif.chatName}</div>
                    <div className="text-sm text-gray-700 truncate">{notif.senderName}: {notif.content}</div>
                    <div className="text-xs text-blue-400 mt-1">{notif.time}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-white/10 backdrop-blur-lg m-4 rounded-3xl shadow-2xl border border-blue-400/40 overflow-x-auto overflow-y-auto">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-blue-400/40 bg-gradient-to-r from-blue-900/60 to-purple-900/60 rounded-t-3xl flex items-center gap-4 justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
                  {user?.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <span className="text-white font-bold text-xl">{(user?.displayName || 'U')[0]}</span>
                  )}
                </div>
                <div>
                  {selectedChatObj?.isGroup ? (
                    <h2 className="font-bold text-white text-2xl drop-shadow">
                      {selectedChatObj.name || 'Group Chat'}
                    </h2>
                  ) : (
                    <h2 className="font-bold text-white text-2xl drop-shadow">
                      {
                        (() => {
                          if (!selectedChatObj || !user) return 'Chat';
                          const otherId = selectedChatObj.participants.find(id => id !== user.uid);
                          const otherUser = users.find(u => u.id === otherId);
                          return otherUser?.name || 'Chat';
                        })()
                      }
                    </h2>
                  )}
                  <p className="text-sm text-blue-200">Online</p>
                </div>
              </div>
            </div>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl p-4 shadow-2xl transition-all duration-200 ${
                      message.senderId === user?.uid
                        ? 'border-2 border-blue-400 bg-blue-800/40 shadow-[0_0_12px_2px_rgba(59,130,246,0.7)] text-white'
                        : 'bg-white/80 text-gray-900 border border-blue-200'
                    }`}
                  >
                    {editingId === message.id ? (
                      <form onSubmit={handleEditSubmit} className="flex gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          className="flex-1 p-2 rounded border"
                        />
                        <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded">Save</button>
                        <button type="button" onClick={() => setEditingId(null)} className="px-2 py-1 bg-gray-400 text-white rounded">Cancel</button>
                      </form>
                    ) : (
                      <>
                    <p className="text-lg font-medium">{message.content}</p>
                    <p className="text-xs mt-2 opacity-70 text-right">
                      {message.senderName} • {message.createdAt && dayjs(message.createdAt.seconds ? message.createdAt.seconds * 1000 : message.createdAt.toDate()).format('h:mm A')}
                    </p>
                        {message.senderId === user?.uid && (
                          <div className="flex gap-2 mt-2 justify-end">
                            <button onClick={() => handleEdit(message.id, message.content)} className="text-xs text-blue-200 hover:text-blue-400">Edit</button>
                            <button onClick={() => onDeleteMessage(message.id)} className="text-xs text-red-300 hover:text-red-500">Delete</button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Message Input */}
            <MessageInput newMessage={newMessage} onMessageChange={onMessageChange} onSendMessage={onSendMessage} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/80">
            <h2 className="text-4xl font-extrabold mb-4 drop-shadow-lg">Welcome to BanterBox</h2>
            <p className="text-lg">Select a chat or start a new conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
}

const MessageInput = memo(function MessageInput({ newMessage, onMessageChange, onSendMessage }: {
  newMessage: string;
  onMessageChange: (value: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
}) {
  return (
            <form onSubmit={onSendMessage} className="flex items-center gap-4 p-6 bg-white/20 rounded-b-3xl border-t border-blue-400/40">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 p-4 rounded-xl bg-white/70 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-inner"
              />
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
              >
                Send
              </button>
            </form>
  );
}); 