'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  onCreateGroup: (name: string, selectedUserIds: string[]) => void;
}

export default function CreateGroupModal({ 
  isOpen, 
  onClose, 
  users, 
  onCreateGroup
}: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isCreating, setIsCreating] = useState(false);

  const handleUserToggle = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.size === 0) return;
    
    setIsCreating(true);
    try {
      await onCreateGroup(groupName.trim(), Array.from(selectedUsers));
      setGroupName('');
      setSelectedUsers(new Set());
      onClose();
    } catch (error) {
      console.error('Error creating group:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/95 backdrop-blur-lg rounded-3xl p-6 w-96 max-h-[80vh] overflow-y-auto shadow-2xl border border-blue-400/40">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Group Chat</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Group Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name..."
            className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        {/* User Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Members ({selectedUsers.size} selected)
          </label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserToggle(user.id)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition ${
                  selectedUsers.has(user.id)
                    ? 'bg-blue-100 border-2 border-blue-400'
                    : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  {user.photoURL ? (
                    <Image
                      src={user.photoURL}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <span className="text-white font-bold text-sm">{user.name[0]}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{user.name}</h3>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedUsers.has(user.id)
                    ? 'bg-blue-400 border-blue-400'
                    : 'border-gray-300'
                }`}>
                  {selectedUsers.has(user.id) && (
                    <div className="w-full h-full bg-blue-400 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.size === 0 || isCreating}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Creating...' : 'Create Group'}
          </button>
        </div>
      </div>
    </div>
  );
} 