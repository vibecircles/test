const express = require('express');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all notifications for current user
router.get('/', auth, async (req, res) => {
    try {
        const { data: notifications, error } = await db.supabase
            .from('notifications')
            .select(`
                *,
                sender:users!notifications_sender_id_fkey(id, name, avatar),
                recipient:users!notifications_recipient_id_fkey(id, name, avatar)
            `)
            .eq('recipient_id', req.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications'
        });
    }
});

// Get unread notification count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const { count, error } = await db.supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('recipient_id', req.user.id)
            .eq('is_read', false);

        if (error) throw error;

        res.json({
            success: true,
            data: { count: count || 0 }
        });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching unread count'
        });
    }
});

// Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await db.supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('recipient_id', req.user.id)
            .select()
            .single();

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notification as read'
        });
    }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req, res) => {
    try {
        const { data, error } = await db.supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('recipient_id', req.user.id)
            .eq('is_read', false)
            .select();

        if (error) throw error;

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking all notifications as read'
        });
    }
});

// Delete notification
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await db.supabase
            .from('notifications')
            .delete()
            .eq('id', id)
            .eq('recipient_id', req.user.id);

        if (error) throw error;

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting notification'
        });
    }
});

// Create notification (internal use)
const createNotification = async (recipientId, senderId, type, content, relatedId = null) => {
    try {
        const { data, error } = await db.supabase
            .from('notifications')
            .insert({
                recipient_id: recipientId,
                sender_id: senderId,
                type,
                content,
                related_id: relatedId,
                is_read: false
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

// Export the createNotification function for use in other routes
module.exports = { router, createNotification };
