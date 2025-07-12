import { useState, useRef, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  getDocs,
  Firestore,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import { db as importedDb } from '@/lib/firebase';
const db: Firestore = importedDb;

export interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: Timestamp;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  createdAt: Timestamp;
  isGroup?: boolean;
  name?: string;
  ownerId?: string;
  chatKey?: string;
}

export const useFirestore = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [messagesByChat, setMessagesByChat] = useState<{ [chatId: string]: Message[] }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messageListeners = useRef<{ [chatId: string]: () => void }>({});

  // Get all chats for current user
  const getChats = useCallback((userId: string) => {
    try {
      setError(null);
      const q = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', userId),
        orderBy('createdAt', 'desc')
      );

      return onSnapshot(q, 
        (snapshot) => {
          const chatList: Chat[] = [];
          snapshot.forEach((doc) => {
            chatList.push({ id: doc.id, ...doc.data() } as Chat);
          });
          setChats(chatList);
          setLoading(false);
          
          // Automatically fetch messages for all chats to enable notifications
          chatList.forEach(chat => {
            if (!messageListeners.current[chat.id]) {
              getMessages(chat.id);
            }
          });
        },
        (error) => {
          console.error('Error fetching chats:', error);
          // Check if the error is about missing index
          if (error.message.includes('requires an index')) {
            setError('Please wait while we set up the database. This may take a few minutes.');
          } else {
            setError('Failed to fetch chats');
          }
          setLoading(false);
        }
      );
    } catch (error: unknown) {
      console.error('Error setting up chats listener:', error);
      // Check if the error is about missing index
      if (error instanceof Error && error.message?.includes('requires an index')) {
        setError('Please wait while we set up the database. This may take a few minutes.');
      } else {
        setError('Failed to set up chats listener');
      }
      setLoading(false);
      return () => {};
    }
  }, []);

  // Refactored getMessages
  const getMessages = useCallback((chatId: string) => {
    console.log('[getMessages] Setting up listener for chat', chatId);
    // Unsubscribe previous listener for this chat if exists
    if (messageListeners.current[chatId]) {
      messageListeners.current[chatId]();
    }
    setError(null);
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        console.log('[getMessages] Snapshot docs:', snapshot.docs.map(doc => doc.data()));
        const messageList: Message[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.createdAt) {
            messageList.push({ id: doc.id, ...data } as Message);
          }
        });
        console.log('[getMessages] Fetched messages for chat', chatId, messageList);
        setMessagesByChat((prev) => ({
          ...prev,
          [chatId]: messageList,
        }));
      },
      (error) => {
        console.error('[getMessages] Error fetching messages:', error);
        setError('Failed to fetch messages');
      }
    );
    messageListeners.current[chatId] = unsubscribe;
    return unsubscribe;
  }, []);

  // Create a new chat
  const createChat = useCallback(async (participants: string[]) => {
    const sortedParticipants = [...participants].sort();
    const chatKey = sortedParticipants.join('_');
    try {
      setError(null);
      const chatRef = await addDoc(collection(db, 'chats'), {
        participants: sortedParticipants,
        chatKey,
        createdAt: serverTimestamp(),
      });
      return chatRef.id;
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Failed to create chat');
      throw error;
    }
  }, []);

  // Send a message
  const sendMessage = useCallback(async (chatId: string, message: Omit<Message, 'id' | 'createdAt'>) => {
    try {
      setError(null);
      console.log('[sendMessage] Sending message to chat', chatId, message);
      const messageRef = await addDoc(collection(db, 'chats', chatId, 'messages'), {
        ...message,
        createdAt: serverTimestamp(),
      });
      console.log('[sendMessage] Message sent, ref:', messageRef.id);
      // Update last message in chat
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          ...message,
          createdAt: serverTimestamp(),
        },
      });
      return messageRef.id;
    } catch (error) {
      console.error('[sendMessage] Error sending message:', error);
      setError('Failed to send message');
      throw error;
    }
  }, []);

  // Create a group chat
  const createGroupChat = useCallback(async (name: string, participants: string[], ownerId: string) => {
    try {
      setError(null);
      const chatRef = await addDoc(collection(db, 'chats'), {
        name,
        participants,
        ownerId,
        isGroup: true,
        createdAt: serverTimestamp(),
      });
      return chatRef.id;
    } catch (error) {
      console.error('Error creating group chat:', error);
      setError('Failed to create group chat');
      throw error;
    }
  }, []);

  // Add user to group chat
  const addUserToGroup = useCallback(async (chatId: string, userId: string) => {
    try {
      setError(null);
      await updateDoc(doc(db, 'chats', chatId), {
        participants: arrayUnion(userId),
      });
    } catch (error) {
      console.error('Error adding user to group:', error);
      setError('Failed to add user to group');
      throw error;
    }
  }, []);

  // Remove user from group chat
  const removeUserFromGroup = useCallback(async (chatId: string, userId: string) => {
    try {
      setError(null);
      await updateDoc(doc(db, 'chats', chatId), {
        participants: arrayRemove(userId),
      });
    } catch (error) {
      console.error('Error removing user from group:', error);
      setError('Failed to remove user from group');
      throw error;
    }
  }, []);

  const deleteMessage = useCallback(async (chatId: string, messageId: string) => {
    try {
      await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message');
      throw error;
    }
  }, []);

  const editMessage = useCallback(async (chatId: string, messageId: string, newContent: string) => {
    try {
      await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
        content: newContent,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error editing message:', error);
      setError('Failed to edit message');
      throw error;
    }
  }, []);

  const editGroupName = useCallback(async (chatId: string, newName: string) => {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        name: newName,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error editing group name:', error);
      setError('Failed to edit group name');
      throw error;
    }
  }, []);

  // Clean up all listeners on unmount
  useEffect(() => () => { Object.values(messageListeners.current).forEach(unsub => unsub()); }, []);

  const findChatWithParticipants = useCallback(async (participants: string[]): Promise<Chat | null> => {
    const sortedParticipants = [...participants].sort();
    const chatKey = sortedParticipants.join('_');
    const q = query(
      collection(db, 'chats'),
      where('chatKey', '==', chatKey)
    );
    const snapshot = await getDocs(q);
    for (const docSnap of snapshot.docs) {
      const chatData = docSnap.data() as Chat;
        return { ...chatData, id: docSnap.id };
    }
    return null;
  }, []);

  return {
    chats,
    messagesByChat,
    loading,
    error,
    getChats,
    getMessages,
    createChat,
    sendMessage,
    createGroupChat,
    addUserToGroup,
    removeUserFromGroup,
    findChatWithParticipants,
    deleteMessage,
    editMessage,
    editGroupName,
  };
}; 