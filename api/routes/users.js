const express = require('express');
const db = require('../config/database');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all users (with pagination and search)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search;

    let queryOptions = {
      select: `
        id, username, email, role, created_at, last_login, is_active,
        profiles:profiles(user_id, full_name, bio, avatar_url, cover_url, location, privacy)
      `,
      orderBy: { column: 'created_at', ascending: false },
      limit,
      offset
    };

    // Add search filter if provided
    if (search) {
      // This would need to be implemented with Supabase's text search
      // For now, we'll filter by username
      queryOptions.where = { username: search };
    }

    const users = await db.query('users', queryOptions);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: users.length
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user profile by ID
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await db.query('users', {
      select: `
        id, username, email, role, created_at, last_login, is_active,
        profiles:profiles(user_id, full_name, bio, avatar_url, cover_url, birthday, location, website, gender, phone, privacy),
        user_settings:user_settings(user_id, profile_visibility, post_visibility, theme, language, timezone)
      `,
      where: { id: userId }
    });

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check privacy settings
    const userData = user[0];
    const profile = userData.profiles?.[0];
    const settings = userData.user_settings?.[0];

    if (profile?.privacy === 'private' && (!req.user || req.user.id !== parseInt(userId))) {
      return res.status(403).json({
        success: false,
        message: 'This profile is private'
      });
    }

    res.json({
      success: true,
      data: userData
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user posts
router.get('/:id/posts', optionalAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if user exists
    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check privacy settings
    const profile = await db.findByField('profiles', 'user_id', userId);
    if (profile?.privacy === 'private' && (!req.user || req.user.id !== parseInt(userId))) {
      return res.status(403).json({
        success: false,
        message: 'This profile is private'
      });
    }

    const posts = await db.query('posts', {
      select: `
        *,
        users:user_id(id, username, email),
        profiles:users!user_id(user_id, full_name, avatar_url),
        groups:group_id(id, name, description, cover_url),
        comments:comments(id, content, created_at, user_id),
        likes:likes(id, user_id)
      `,
      where: { user_id: userId },
      orderBy: { column: 'created_at', ascending: false },
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: posts.length
        }
      }
    });

  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Send friend request
router.post('/:id/friend-request', auth, async (req, res) => {
  try {
    const friendId = req.params.id;

    if (req.user.id === parseInt(friendId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send a friend request to yourself'
      });
    }

    // Check if friend exists
    const friend = await db.findById('users', friendId);
    if (!friend) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if friendship already exists
    const existingFriendship = await db.query('friendships', {
      where: { user_id: req.user.id, friend_id: friendId }
    });

    if (existingFriendship && existingFriendship.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Friend request already sent or friendship exists'
      });
    }

    // Create friend request
    await db.insert('friendships', {
      user_id: req.user.id,
      friend_id: friendId,
      status: 'pending'
    });

    res.json({
      success: true,
      message: 'Friend request sent successfully'
    });

  } catch (error) {
    console.error('Send friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Accept/Reject friend request
router.put('/:id/friend-request', auth, async (req, res) => {
  try {
    const friendId = req.params.id;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "accept" or "reject"'
      });
    }

    // Check if friend request exists
    const friendship = await db.query('friendships', {
      where: { user_id: friendId, friend_id: req.user.id, status: 'pending' }
    });

    if (!friendship || friendship.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Friend request not found'
      });
    }

    if (action === 'accept') {
      // Accept friend request
      await db.update('friendships', friendship[0].id, {
        status: 'accepted',
        accepted_at: new Date().toISOString()
      });

      res.json({
        success: true,
        message: 'Friend request accepted'
      });
    } else {
      // Reject friend request (delete it)
      await db.delete('friendships', friendship[0].id);

      res.json({
        success: true,
        message: 'Friend request rejected'
      });
    }

  } catch (error) {
    console.error('Handle friend request error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user friends
router.get('/:id/friends', optionalAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if user exists
    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get accepted friendships
    const friendships = await db.query('friendships', {
      select: `
        *,
        users:user_id(id, username, email),
        profiles:users!user_id(user_id, full_name, avatar_url)
      `,
      where: { 
        user_id: userId, 
        status: 'accepted' 
      },
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        friends: friendships,
        pagination: {
          page,
          limit,
          total: friendships.length
        }
      }
    });

  } catch (error) {
    console.error('Get user friends error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pending friend requests
router.get('/friend-requests/pending', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const pendingRequests = await db.query('friendships', {
      select: `
        *,
        users:user_id(id, username, email),
        profiles:users!user_id(user_id, full_name, avatar_url)
      `,
      where: { 
        friend_id: req.user.id, 
        status: 'pending' 
      },
      orderBy: { column: 'requested_at', ascending: false },
      limit,
      offset
    });

    res.json({
      success: true,
      data: {
        pendingRequests,
        pagination: {
          page,
          limit,
          total: pendingRequests.length
        }
      }
    });

  } catch (error) {
    console.error('Get pending friend requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove friend
router.delete('/:id/friend', auth, async (req, res) => {
  try {
    const friendId = req.params.id;

    // Find and delete friendship (both directions)
    const friendships = await db.query('friendships', {
      where: { 
        user_id: req.user.id, 
        friend_id: friendId 
      }
    });

    if (friendships && friendships.length > 0) {
      await db.delete('friendships', friendships[0].id);
    }

    const reverseFriendships = await db.query('friendships', {
      where: { 
        user_id: friendId, 
        friend_id: req.user.id 
      }
    });

    if (reverseFriendships && reverseFriendships.length > 0) {
      await db.delete('friendships', reverseFriendships[0].id);
    }

    res.json({
      success: true,
      message: 'Friend removed successfully'
    });

  } catch (error) {
    console.error('Remove friend error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Block user
router.post('/:id/block', auth, async (req, res) => {
  try {
    const userId = req.params.id;

    if (req.user.id === parseInt(userId)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself'
      });
    }

    // Check if user exists
    const user = await db.findById('users', userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create or update friendship status to blocked
    const existingFriendship = await db.query('friendships', {
      where: { user_id: req.user.id, friend_id: userId }
    });

    if (existingFriendship && existingFriendship.length > 0) {
      await db.update('friendships', existingFriendship[0].id, {
        status: 'blocked'
      });
    } else {
      await db.insert('friendships', {
        user_id: req.user.id,
        friend_id: userId,
        status: 'blocked'
      });
    }

    res.json({
      success: true,
      message: 'User blocked successfully'
    });

  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
