'use client';

import dayjs from 'dayjs';
import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import Image from 'next/image';
import React, { memo } from 'react';

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
  debugLog
}: ChatAreaProps) {
  // REMOVE notificationRef, notification UI, and notification logic

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
          <h1 className="text-3xl font-extrabold text-white tracking-wide drop-shadow-lg">Talk-A-Tive</h1>
        </div>
        {/* REMOVE notification UI */}
      </div>

      {/* Notification Dropdown (fixed, not inside top bar) */}
      {/* REMOVE notification UI */}

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
                  <h2 className="font-bold text-white text-2xl drop-shadow">
                    {chats.find(chat => chat.id === selectedChat && chat.name)?.name ||
                      users.find(u =>
                        chats.find(
                          chat =>
                            chat.id === selectedChat &&
                            chat.participants.includes(u.id) &&
                            user?.uid && chat.participants.includes(user.uid)
                        )
                      )?.name || 'Chat'}
                  </h2>
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
                    <p className="text-lg font-medium">{message.content}</p>
                    <p className="text-xs mt-2 opacity-70 text-right">
                      {message.senderName} • {message.createdAt && dayjs(message.createdAt.seconds ? message.createdAt.seconds * 1000 : message.createdAt.toDate()).format('h:mm A')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {/* Message Input */}
            <MessageInput newMessage={newMessage} onMessageChange={onMessageChange} onSendMessage={onSendMessage} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-white/80">
            <h2 className="text-4xl font-extrabold mb-4 drop-shadow-lg">Welcome to Talk-A-Tive</h2>
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