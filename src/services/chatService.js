import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  Timestamp,
  startAfter,
  getDocs
} from 'firebase/firestore';
import { db } from '../config/firebase';

const MESSAGES_COLLECTION = 'room_messages';
const MESSAGE_LIMIT = 50;

/**
 * Subscribe to real-time messages for a room
 * @param {string} roomId - The room ID to subscribe to
 * @param {function} callback - Callback function to receive messages
 * @returns {function} Unsubscribe function
 */
export const subscribeToMessages = (roomId, callback) => {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('roomId', '==', roomId),
    orderBy('createdAt', 'desc'),
    limit(MESSAGE_LIMIT)
  );

  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .reverse(); // Reverse to show oldest first at top
    callback(messages);
  }, (error) => {
    console.error('Error subscribing to messages:', error);
    callback([]);
  });
};

/**
 * Send a user message
 * @param {object} messageData - Message data
 * @returns {Promise<DocumentReference>}
 */
export const sendMessage = async ({ roomId, senderId, senderName, text, type = 'user' }) => {
  if (!text || text.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }

  if (text.length > 500) {
    throw new Error('Message too long (max 500 characters)');
  }

  return addDoc(collection(db, MESSAGES_COLLECTION), {
    roomId,
    senderId,
    senderName,
    text: text.trim(),
    type,
    createdAt: Timestamp.now()
  });
};

/**
 * Post a system message (for expense/settlement events)
 * @param {string} roomId - Room ID
 * @param {string} text - System message text
 * @returns {Promise<DocumentReference>}
 */
export const postSystemMessage = async (roomId, text) => {
  return addDoc(collection(db, MESSAGES_COLLECTION), {
    roomId,
    senderId: null,
    senderName: 'System',
    text,
    type: 'system',
    createdAt: Timestamp.now()
  });
};

/**
 * Load more messages for pagination
 * @param {string} roomId - Room ID
 * @param {Timestamp} lastTimestamp - Timestamp of the oldest loaded message
 * @returns {Promise<Array>} Array of older messages
 */
export const loadMoreMessages = async (roomId, lastTimestamp) => {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('roomId', '==', roomId),
    orderBy('createdAt', 'desc'),
    startAfter(lastTimestamp),
    limit(MESSAGE_LIMIT)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() }))
    .reverse();
};

/**
 * Get message count for a room (for unread badge calculation)
 * @param {string} roomId - Room ID
 * @param {Date} since - Get messages since this date
 * @returns {Promise<number>} Message count
 */
export const getMessageCountSince = async (roomId, since) => {
  const q = query(
    collection(db, MESSAGES_COLLECTION),
    where('roomId', '==', roomId),
    where('createdAt', '>', Timestamp.fromDate(since))
  );

  const snapshot = await getDocs(q);
  return snapshot.size;
};
