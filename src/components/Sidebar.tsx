'use client';

import { useState } from 'react';
import { UserGroupIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Timestamp } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import CreateGroupModal from './CreateGroupModal';
import Image from 'next/image';

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

interface SidebarProps {
  users: User[];
  chats: Chat[];
  selectedChat: string | null;
  user: FirebaseUser | null;
  onStartChat: (userId: string) => void;
  onCreateGroupChat: (name: string, participants: string[]) => Promise<string>;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  onEditGroupName?: (chatId: string, newName: string) => void;
}

export default function Sidebar({ 
  users, 
  chats, 
  selectedChat, 
  user, 
  onStartChat, 
  onCreateGroupChat,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  onEditGroupName
}: SidebarProps) {
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [groupNameValue, setGroupNameValue] = useState('');

  const handleCreateGroup = async (name: string, selectedUserIds: string[]) => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      const participants = [user.uid, ...selectedUserIds];
      const chatId = await onCreateGroupChat(name, participants);
      console.log('[Sidebar] Group chat created successfully:', chatId);
      // The chat will be automatically selected by the parent component
    } catch (error) {
      console.error('[Sidebar] Error creating group chat:', error);
      // You could add a toast notification here
      alert('Failed to create group chat. Please try again.');
    }
  };

  const handleSearchUser = (userId: string) => {
    onStartChat(userId);
    setShowSearchModal(false);
    setSearchQuery('');
  };

  // Filter users based on search query
  const filteredUsers = users.filter(userItem => 
    userItem.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    userItem.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggleMobileSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-50
        w-80 max-w-[85vw] sm:max-w-sm
        bg-white/20 backdrop-blur-lg border-r border-blue-400/40 shadow-xl
        transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col
        rounded-t-3xl rounded-b-3xl
        mb-4
      `}>
        {/* Header */}
        <div className="p-4 border-b border-blue-400/40 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white drop-shadow-lg">Chats</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="relative p-2 text-white hover:bg-blue-400/20 rounded-full transition shadow-md hover:shadow-blue-400 group"
            >
              <UserGroupIcon className="w-6 h-6" />
              <span className="absolute left-1/2 -translate-x-1/2 top-10 bg-blue-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-lg">
                Create Group
              </span>
            </button>
            <button 
              onClick={() => setShowSearchModal(true)}
              className="relative p-2 text-white hover:bg-blue-400/20 rounded-full transition shadow-md hover:shadow-blue-400 group"
            >
              <MagnifyingGlassIcon className="w-6 h-6" />
              <span className="absolute left-1/2 -translate-x-1/2 top-10 bg-blue-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap shadow-lg">
                Search Users
              </span>
            </button>
            {/* Mobile close button */}
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 text-white hover:bg-blue-400/20 rounded-full transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* User List */}
        {user?.uid && (
          <div className="overflow-y-auto h-[calc(100vh-5rem)]">
            {/* Individual Users */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-blue-200 px-4 mb-2 mt-4">Individual Chats</h3>
              {users.map((userItem) => {
                // Find the selected chat object
                const selectedChatObj = chats.find(chat => chat.id === selectedChat);
                const isActive = selectedChatObj &&
                  selectedChatObj.participants.length === 2 &&
                  selectedChatObj.participants.includes(userItem.id) &&
                  selectedChatObj.participants.includes(user?.uid);
                
                if (isActive) {
                  console.log('[UserList] HIGHLIGHTED user:', userItem.name, userItem.id);
                }
                
                return (
                  <div
                    key={userItem.id}
                    onClick={() => onStartChat(userItem.id)}
                    className={`p-4 hover:bg-blue-400/10 cursor-pointer transition rounded-xl mb-2 flex items-center gap-3 ${
                      isActive ? 'border-2 border-blue-400 bg-blue-800/40 shadow-[0_0_12px_2px_rgba(59,130,246,0.7)]' : ''
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
                      {userItem.photoURL ? (
                        <Image
                          src={userItem.photoURL}
                          alt={userItem.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <span className="text-white font-bold text-lg">{userItem.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white drop-shadow">{userItem.name}</h3>
                      <p className="text-xs text-blue-200">{userItem.email}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Group Chats */}
            <div>
              <h3 className="text-sm font-semibold text-blue-200 px-4 mb-2">Group Chats</h3>
              {chats
                .filter(chat => chat.isGroup && chat.participants.includes(user?.uid))
                .map((groupChat) => {
                  const isActive = groupChat.id === selectedChat;
                  return (
                    <div
                      key={groupChat.id}
                      onClick={() => onStartChat(groupChat.id)}
                      className={`p-4 hover:bg-blue-400/10 cursor-pointer transition rounded-xl mb-2 flex items-center gap-3 ${
                        isActive ? 'border-2 border-blue-400 bg-blue-800/40 shadow-[0_0_12px_2px_rgba(59,130,246,0.7)]' : ''
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center shadow-lg">
                        <UserGroupIcon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        {editingGroupId === groupChat.id ? (
                          <form
                            onSubmit={e => {
                              e.preventDefault();
                              if (onEditGroupName && groupNameValue.trim()) {
                                onEditGroupName(groupChat.id, groupNameValue.trim());
                                setEditingGroupId(null);
                              }
                            }}
                            className="flex gap-2 items-center"
                            onClick={e => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={groupNameValue}
                              onChange={e => setGroupNameValue(e.target.value)}
                              className="p-1 rounded border text-white"
                              autoFocus
                            />
                            <button type="submit" className="px-2 py-1 bg-blue-500 text-white rounded">Save</button>
                            <button type="button" onClick={e => { e.stopPropagation(); setEditingGroupId(null); }} className="px-2 py-1 bg-gray-400 text-white rounded">Cancel</button>
                          </form>
                        ) : (
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white drop-shadow">{groupChat.name || 'Group Chat'}</h3>
                            {onEditGroupName && (
                              <button
                                onClick={e => { e.stopPropagation(); setEditingGroupId(groupChat.id); setGroupNameValue(groupChat.name || 'Group Chat'); }}
                                className="text-xs text-blue-200 hover:text-blue-400 underline"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        )}
                        <p className="text-xs text-blue-200">{groupChat.participants.length} members</p>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Search Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white/10 backdrop-blur-lg border border-blue-400/40 rounded-2xl p-6 w-96 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white">Search Users</h3>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setSearchQuery('');
                }}
                className="text-blue-300 hover:text-white transition"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-blue-400/40 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:border-blue-400"
                autoFocus
              />
            </div>
            
            <div className="overflow-y-auto max-h-64">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((userItem) => (
                  <div
                    key={userItem.id}
                    onClick={() => handleSearchUser(userItem.id)}
                    className="p-3 hover:bg-blue-400/10 cursor-pointer transition rounded-lg mb-2 flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg">
                      {userItem.photoURL ? (
                        <Image
                          src={userItem.photoURL}
                          alt={userItem.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <span className="text-white font-bold text-sm">{userItem.name[0]}</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{userItem.name}</h4>
                      <p className="text-xs text-blue-200">{userItem.email}</p>
                    </div>
                  </div>
                ))
              ) : searchQuery ? (
                <p className="text-blue-200 text-center py-4">No users found</p>
              ) : (
                <p className="text-blue-200 text-center py-4">Start typing to search users</p>
              )}
            </div>
          </div>
        </div>
      )}

      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        users={users}
        onCreateGroup={handleCreateGroup}
      />
    </>
  );
} 