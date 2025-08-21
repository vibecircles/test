const express = require('express');
const db = require('../config/database');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get conversations for current user
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get all conversations (unique users the current user has messaged with)
    const conversations = await db.query(`
      SELECT DISTINCT 
        u.id,
        u.username,
        p.full_name,
        p.avatar_url,
        (
          SELECT m.content 
          FROM messages m 
          WHERE (m.sender_id = u.id AND m.receiver_id = ?) 
             OR (m.sender_id = ? AND m.receiver_id = u.id)
          ORDER BY m.created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT m.created_at 
          FROM messages m 
          WHERE (m.sender_id = u.id AND m.receiver_id = ?) 
             OR (m.sender_id = ? AND m.receiver_id = u.id)
          ORDER BY m.created_at DESC 
          LIMIT 1
        ) as last_message_time,
        (
          SELECT COUNT(*) 
          FROM messages m 
          WHERE m.sender_id = u.id 
            AND m.receiver_id = ? 
            AND m.is_read = false
        ) as unread_count
      FROM users u
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE u.id IN (
        SELECT DISTINCT 
          CASE 
            WHEN sender_id = ? THEN receiver_id 
            ELSE sender_id 
          END
        FROM messages 
        WHERE sender_id = ? OR receiver_id = ?
      )
      ORDER BY last_message_time DESC
    `, [userId, userId, userId, userId, userId, userId, userId, userId]);

    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
});

// Get messages between two users
router.get('/conversation/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = parseInt(req.params.userId);

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    // Get messages between the two users
    const messages = await db.query(`
      SELECT 
        m.*,
        u.username,
        p.full_name,
        p.avatar_url
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.id
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [currentUserId, otherUserId, otherUserId, currentUserId]);

    // Mark messages as read
    await db.query(`
      UPDATE messages 
      SET is_read = true 
      WHERE sender_id = ? AND receiver_id = ? AND is_read = false
    `, [otherUserId, currentUserId]);

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Send a message
router.post('/send', auth, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.id;

    if (!receiverId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Receiver ID and content are required'
      });
    }

    if (senderId === receiverId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot send message to yourself'
      });
    }

    // Check if receiver exists
    const receiver = await db.findById('users', receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create message
    const messageData = {
      sender_id: senderId,
      receiver_id: receiverId,
      content: content.trim(),
      is_read: false
    };

    const message = await db.insert('messages', messageData);

    // Get message with sender info
    const fullMessage = await db.query(`
      SELECT 
        m.*,
        u.username,
        p.full_name,
        p.avatar_url
      FROM messages m
      INNER JOIN users u ON m.sender_id = u.id
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE m.id = ?
    `, [message.id]);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: fullMessage[0]
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
});

// Mark messages as read
router.put('/read/:userId', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = parseInt(req.params.userId);

    if (!otherUserId) {
      return res.status(400).json({
        success: false,
        message: 'Valid user ID is required'
      });
    }

    await db.query(`
      UPDATE messages 
      SET is_read = true 
      WHERE sender_id = ? AND receiver_id = ? AND is_read = false
    `, [otherUserId, currentUserId]);

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
});

// Get unread message count
router.get('/unread-count', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await db.query(`
      SELECT COUNT(*) as count
      FROM messages 
      WHERE receiver_id = ? AND is_read = false
    `, [userId]);

    res.json({
      success: true,
      data: {
        unreadCount: result[0].count
      }
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
});

// Delete a message (only sender can delete)
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const messageId = parseInt(req.params.messageId);
    const userId = req.user.id;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        message: 'Valid message ID is required'
      });
    }

    // Check if message exists and user is the sender
    const message = await db.query(`
      SELECT * FROM messages WHERE id = ? AND sender_id = ?
    `, [messageId, userId]);

    if (!message.length) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or you are not authorized to delete it'
      });
    }

    await db.delete('messages', messageId);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

module.exports = router;
