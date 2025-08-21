const express = require('express');
const db = require('../config/database');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all posts (with pagination)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const groupId = req.query.groupId;

    let queryOptions = {
      select: `
        *,
        users:user_id(id, username, email),
        profiles:users!user_id(user_id, full_name, avatar_url),
        groups:group_id(id, name, description, cover_url),
        comments:comments(id, content, created_at, user_id),
        likes:likes(id, user_id)
      `,
      orderBy: { column: 'created_at', ascending: false },
      limit,
      offset
    };

    if (groupId) {
      queryOptions.where = { group_id: groupId };
    }

    const posts = await db.query('posts', queryOptions);

    // Get total count for pagination
    let countQuery = supabase.from('posts').select('id', { count: 'exact' });
    if (groupId) {
      countQuery = countQuery.eq('group_id', groupId);
    }
    const { count } = await countQuery;

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil(count / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single post
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    
    const post = await db.query('posts', {
      select: `
        *,
        users:user_id(id, username, email),
        profiles:users!user_id(user_id, full_name, avatar_url),
        groups:group_id(id, name, description, cover_url),
        comments:comments(id, content, created_at, user_id, profiles:users!user_id(user_id, full_name, avatar_url)),
        likes:likes(id, user_id)
      `,
      where: { id: postId }
    });

    if (!post || post.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: post[0]
    });

  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new post
router.post('/', auth, async (req, res) => {
  try {
    const { content, groupId, privacy, mediaUrl } = req.body;

    if (!content && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Content or media is required'
      });
    }

    const postData = {
      user_id: req.user.id,
      content: content || null,
      group_id: groupId || null,
      privacy: privacy || 'public',
      media_url: mediaUrl || null,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0
    };

    const post = await db.insert('posts', postData);

    // Get the created post with user and profile info
    const createdPost = await db.query('posts', {
      select: `
        *,
        users:user_id(id, username, email),
        profiles:users!user_id(user_id, full_name, avatar_url),
        groups:group_id(id, name, description, cover_url)
      `,
      where: { id: post.id }
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: createdPost[0]
    });

  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update post
router.put('/:id', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const { content, privacy } = req.body;

    // Check if post exists and belongs to user
    const existingPost = await db.findById('posts', postId);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (existingPost.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own posts'
      });
    }

    const updateData = {};
    if (content !== undefined) updateData.content = content;
    if (privacy !== undefined) updateData.privacy = privacy;

    const updatedPost = await db.update('posts', postId, updateData);

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: updatedPost
    });

  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const postId = req.params.id;

    // Check if post exists and belongs to user
    const existingPost = await db.findById('posts', postId);
    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    if (existingPost.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own posts'
      });
    }

    await db.delete('posts', postId);

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Like/Unlike post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const postId = req.params.id;

    // Check if post exists
    const post = await db.findById('posts', postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Check if user already liked the post
    const existingLike = await db.query('likes', {
      where: { user_id: req.user.id, post_id: postId }
    });

    if (existingLike && existingLike.length > 0) {
      // Unlike
      await db.delete('likes', existingLike[0].id);
      
      // Update post likes count
      await db.update('posts', postId, {
        likes_count: Math.max(0, post.likes_count - 1)
      });

      res.json({
        success: true,
        message: 'Post unliked',
        data: { liked: false }
      });
    } else {
      // Like
      await db.insert('likes', {
        user_id: req.user.id,
        post_id: postId
      });

      // Update post likes count
      await db.update('posts', postId, {
        likes_count: post.likes_count + 1
      });

      res.json({
        success: true,
        message: 'Post liked',
        data: { liked: true }
      });
    }

  } catch (error) {
    console.error('Like/Unlike post error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add comment to post
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const postId = req.params.id;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Comment content is required'
      });
    }

    // Check if post exists
    const post = await db.findById('posts', postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const commentData = {
      post_id: postId,
      user_id: req.user.id,
      content,
      likes_count: 0
    };

    const comment = await db.insert('comments', commentData);

    // Update post comments count
    await db.update('posts', postId, {
      comments_count: post.comments_count + 1
    });

    // Get comment with user info
    const createdComment = await db.query('comments', {
      select: `
        *,
        users:user_id(id, username, email),
        profiles:users!user_id(user_id, full_name, avatar_url)
      `,
      where: { id: comment.id }
    });

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: createdComment[0]
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get comments for a post
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const postId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if post exists
    const post = await db.findById('posts', postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    const comments = await db.query('comments', {
      select: `
        *,
        users:user_id(id, username, email),
        profiles:users!user_id(user_id, full_name, avatar_url)
      `,
      where: { post_id: postId },
      orderBy: { column: 'created_at', ascending: true },
      limit,
      offset
    });

    res.json({
      success: true,
      data: comments
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
