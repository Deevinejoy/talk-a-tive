'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useFirestore } from '@/hooks/useFirestore';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Sidebar from '@/components/Sidebar';
import ChatArea from '@/components/ChatArea';

interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
}

interface Notification {
  chatId: string;
  senderName: string;
  content: string;
  chatName: string;
  time: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { chats, messagesByChat, loading: firestoreLoading, getChats, sendMessage, createChat, findChatWithParticipants, createGroupChat, deleteMessage, editMessage, editGroupName } = useFirestore();
  
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastNotifiedMessageIds, setLastNotifiedMessageIds] = useState<{ [chatId: string]: string }>({});

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      // Get all users
      const fetchUsers = async () => {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersList: User[] = [];
        usersSnapshot.forEach((doc) => {
          if (doc.id !== user.uid) {
            usersList.push({ id: doc.id, ...doc.data() } as User);
          }
        });
        setUsers(usersList);
      };
      fetchUsers();

      // Get current user's Firestore profile
      const fetchCurrentUser = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          console.log('[fetchCurrentUser] Firestore user data:', data);
          setCurrentUserName(data.name || user.displayName || '');
        } else {
          console.log('[fetchCurrentUser] No Firestore user doc found for', user.uid);
          setCurrentUserName(user.displayName || '');
        }
      };
      fetchCurrentUser();

      // Get user's chats
      const unsubscribe = getChats(user.uid);
      return () => unsubscribe();
    }
  }, [user, getChats]);

  // Notification effect
  useEffect(() => {
    if (!user) return;
    Object.entries(messagesByChat).forEach(([chatId, messages]) => {
      if (messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        const lastNotifiedId = lastNotifiedMessageIds[chatId];
        if (
          lastMessage.id !== lastNotifiedId &&
          lastMessage.senderId !== user.uid &&
          chatId !== selectedChat
        ) {
          const chat = chats.find(c => c.id === chatId);
          const chatName = chat?.name ||
            users.find(u =>
              chat?.participants.includes(u.id) &&
              chat?.participants.includes(user.uid) &&
              u.id !== user.uid
            )?.name ||
            'Chat';
          const newNotification: Notification = {
            chatId,
            senderName: lastMessage.senderName,
            content: lastMessage.content,
            chatName,
            time: new Date().toLocaleTimeString(),
          };
          setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
          setLastNotifiedMessageIds(prev => ({ ...prev, [chatId]: lastMessage.id }));
        }
      }
    });
  }, [messagesByChat, user, selectedChat, chats, users, lastNotifiedMessageIds]);

  // Clear notifications when a chat is selected
  useEffect(() => {
    if (selectedChat) {
      setNotifications(prev => prev.filter(notif => notif.chatId !== selectedChat));
    }
  }, [selectedChat]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedChat && user) {
      const senderName = currentUserName || user.displayName || '';
      if (!senderName) {
        console.warn('[handleSendMessage] No sender name available!');
      }
      try {
        console.log('[handleSendMessage] Using senderName:', senderName);
        console.log('[handleSendMessage] Sending to chatId:', selectedChat, 'message:', newMessage);
        await sendMessage(selectedChat, {
          content: newMessage,
          senderId: user.uid,
          senderName: senderName || 'Anonymous',
        });
        setNewMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const handleStartChat = async (userId: string) => {
    if (user) {
      try {
        // Check if this is a group chat (userId will be a chat ID for groups)
        const existingGroupChat = chats.find(chat => chat.id === userId && chat.isGroup);
        if (existingGroupChat) {
          setSelectedChat(userId);
          console.log('[handleStartChat] Selected group chatId:', userId);
          return;
        }

        // Always sort participants for deterministic chatKey
        const participants = [user.uid, userId].sort();
        // Try to find an existing chat
        const existingChat = await findChatWithParticipants(participants);
        console.log('[handleStartChat] existingChat:', existingChat, 'selectedChat:', selectedChat);
        if (existingChat) {
          setSelectedChat(existingChat.id);
          console.log('[handleStartChat] Selected existing chatId:', existingChat.id);
        } else {
          const chatId = await createChat(participants);
          setSelectedChat(chatId);
          console.log('[handleStartChat] Created and selected new chatId:', chatId);
        }
      } catch (error) {
        console.error('Error creating or finding chat:', error);
      }
    }
  };

  const handleCreateGroupChat = async (name: string, participants: string[]): Promise<string> => {
    if (user) {
      try {
        const chatId = await createGroupChat(name, participants, user.uid);
        console.log('[handleCreateGroupChat] Group chat created:', chatId);
        // Automatically select the new group chat
        setSelectedChat(chatId);
        return chatId;
      } catch (error) {
        console.error('Error creating group chat:', error);
        throw error;
      }
    }
    throw new Error('User not authenticated');
  };

  const handleToggleMobileSidebar = () => {
    setIsMobileSidebarOpen((prev) => !prev);
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (selectedChat) {
      try {
        await deleteMessage(selectedChat, messageId);
      } catch (error) {
        console.error('Failed to delete message:', error);
      }
    }
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (selectedChat) {
      try {
        await editMessage(selectedChat, messageId, newContent);
      } catch (error) {
        console.error('Failed to edit message:', error);
      }
    }
  };

  const handleToggleNotifications = () => {
    setShowNotifications(prev => !prev);
  };

  const handleNotificationClick = (chatId: string) => {
    setSelectedChat(chatId);
    setShowNotifications(false);
    setNotifications(prev => prev.filter(notif => notif.chatId !== chatId));
  };

  const handleEditGroupName = async (newName: string) => {
    if (selectedChat) {
      try {
        await editGroupName(selectedChat, newName);
      } catch (error) {
        console.error('Failed to edit group name:', error);
      }
    }
  };

  const messages = selectedChat && messagesByChat[selectedChat] ? messagesByChat[selectedChat] : [];

  if (authLoading || firestoreLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-gray-900 font-[Poppins]">
      <Sidebar
        users={users}
        chats={chats}
        selectedChat={selectedChat}
        user={user}
        onStartChat={handleStartChat}
        onCreateGroupChat={handleCreateGroupChat}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={handleToggleMobileSidebar}
        onEditGroupName={handleEditGroupName}
      />
      <div className="flex-1 flex flex-col relative">
        <ChatArea
          messages={messages}
          selectedChat={selectedChat}
          chats={chats}
          users={users}
          user={user}
          newMessage={newMessage}
          onSendMessage={handleSendMessage}
          onMessageChange={setNewMessage}
          onToggleMobileSidebar={handleToggleMobileSidebar}
          debugLog={(() => { console.log('[ChatArea] Rendering messages:', messages, 'selectedChat:', selectedChat); return null; })()}
          onDeleteMessage={handleDeleteMessage}
          onEditMessage={handleEditMessage}
          notifications={notifications}
          showNotifications={showNotifications}
          onToggleNotifications={handleToggleNotifications}
          onNotificationClick={handleNotificationClick}
        />
      </div>
    </div>
  );
} 