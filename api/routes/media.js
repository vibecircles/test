const express = require('express');
const db = require('../config/database');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get user's media/albums
router.get('/albums/:userId', optionalAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if user exists and get their privacy settings
    const user = await db.query('users', {
      select: 'profiles:profiles(privacy)',
      where: { id: userId }
    });

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profile = user[0].profiles?.[0];
    
    // Check privacy settings
    if (profile?.privacy === 'private' && (!req.user || req.user.id !== parseInt(userId))) {
      return res.status(403).json({
        success: false,
        message: 'This gallery is private'
      });
    }

    // Get albums for the user
    const albums = await db.query('media', {
      select: `
        id, user_id, title, description, cover_url, media_type, 
        created_at, updated_at, privacy, album_id
      `,
      where: { 
        user_id: userId,
        album_id: null, // Only get albums, not individual media
        media_type: 'album'
      },
      orderBy: { column: 'created_at', ascending: false }
    });

    res.json({
      success: true,
      data: {
        albums: albums || []
      }
    });

  } catch (error) {
    console.error('Get albums error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get photos in an album
router.get('/album/:albumId', optionalAuth, async (req, res) => {
  try {
    const albumId = req.params.albumId;

    // Get album details
    const album = await db.query('media', {
      select: `
        id, user_id, title, description, cover_url, media_type, 
        created_at, updated_at, privacy
      `,
      where: { id: albumId, media_type: 'album' }
    });

    if (!album || album.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    const albumData = album[0];

    // Check privacy settings
    if (albumData.privacy === 'private' && (!req.user || req.user.id !== albumData.user_id)) {
      return res.status(403).json({
        success: false,
        message: 'This album is private'
      });
    }

    // Get photos in the album
    const photos = await db.query('media', {
      select: `
        id, user_id, album_id, file_url, file_type, file_size, 
        title, description, created_at, privacy
      `,
      where: { 
        album_id: albumId,
        media_type: 'photo'
      },
      orderBy: { column: 'created_at', ascending: false }
    });

    res.json({
      success: true,
      data: {
        album: albumData,
        photos: photos || []
      }
    });

  } catch (error) {
    console.error('Get album photos error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get user's recent photos
router.get('/photos/:userId', optionalAuth, async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 20;
    
    // Check if user exists and get their privacy settings
    const user = await db.query('users', {
      select: 'profiles:profiles(privacy)',
      where: { id: userId }
    });

    if (!user || user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profile = user[0].profiles?.[0];
    
    // Check privacy settings
    if (profile?.privacy === 'private' && (!req.user || req.user.id !== parseInt(userId))) {
      return res.status(403).json({
        success: false,
        message: 'This gallery is private'
      });
    }

    // Get recent photos
    const photos = await db.query('media', {
      select: `
        id, user_id, album_id, file_url, file_type, file_size, 
        title, description, created_at, privacy
      `,
      where: { 
        user_id: userId,
        media_type: 'photo'
      },
      orderBy: { column: 'created_at', ascending: false },
      limit
    });

    res.json({
      success: true,
      data: {
        photos: photos || []
      }
    });

  } catch (error) {
    console.error('Get photos error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new album
router.post('/album', auth, async (req, res) => {
  try {
    const { title, description, privacy = 'public' } = req.body;
    const userId = req.user.id;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Album title is required'
      });
    }

    const albumData = {
      user_id: userId,
      title,
      description: description || '',
      media_type: 'album',
      privacy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const album = await db.insert('media', albumData);

    res.status(201).json({
      success: true,
      data: album
    });

  } catch (error) {
    console.error('Create album error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Upload photo to album
router.post('/photo', auth, async (req, res) => {
  try {
    const { albumId, title, description, fileUrl, fileType, fileSize, privacy = 'public' } = req.body;
    const userId = req.user.id;

    if (!fileUrl) {
      return res.status(400).json({
        success: false,
        message: 'File URL is required'
      });
    }

    // Verify album exists and belongs to user
    if (albumId) {
      const album = await db.query('media', {
        select: 'id, user_id',
        where: { id: albumId, user_id: userId, media_type: 'album' }
      });

      if (!album || album.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Album not found or access denied'
        });
      }
    }

    const photoData = {
      user_id: userId,
      album_id: albumId || null,
      file_url: fileUrl,
      file_type: fileType || 'image/jpeg',
      file_size: fileSize || 0,
      title: title || '',
      description: description || '',
      media_type: 'photo',
      privacy,
      created_at: new Date().toISOString()
    };

    const photo = await db.insert('media', photoData);

    res.status(201).json({
      success: true,
      data: photo
    });

  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update album
router.put('/album/:albumId', auth, async (req, res) => {
  try {
    const albumId = req.params.albumId;
    const { title, description, privacy, coverUrl } = req.body;
    const userId = req.user.id;

    // Verify album exists and belongs to user
    const album = await db.query('media', {
      select: 'id, user_id',
      where: { id: albumId, user_id: userId, media_type: 'album' }
    });

    if (!album || album.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Album not found or access denied'
      });
    }

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (privacy !== undefined) updateData.privacy = privacy;
    if (coverUrl !== undefined) updateData.cover_url = coverUrl;

    const updatedAlbum = await db.update('media', albumId, updateData);

    res.json({
      success: true,
      data: updatedAlbum
    });

  } catch (error) {
    console.error('Update album error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update photo
router.put('/photo/:photoId', auth, async (req, res) => {
  try {
    const photoId = req.params.photoId;
    const { title, description, privacy, albumId } = req.body;
    const userId = req.user.id;

    // Verify photo exists and belongs to user
    const photo = await db.query('media', {
      select: 'id, user_id',
      where: { id: photoId, user_id: userId, media_type: 'photo' }
    });

    if (!photo || photo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found or access denied'
      });
    }

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (privacy !== undefined) updateData.privacy = privacy;
    if (albumId !== undefined) updateData.album_id = albumId;

    const updatedPhoto = await db.update('media', photoId, updateData);

    res.json({
      success: true,
      data: updatedPhoto
    });

  } catch (error) {
    console.error('Update photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete album
router.delete('/album/:albumId', auth, async (req, res) => {
  try {
    const albumId = req.params.albumId;
    const userId = req.user.id;

    // Verify album exists and belongs to user
    const album = await db.query('media', {
      select: 'id, user_id',
      where: { id: albumId, user_id: userId, media_type: 'album' }
    });

    if (!album || album.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Album not found or access denied'
      });
    }

    // Delete all photos in the album first
    await db.delete('media', { album_id: albumId });

    // Delete the album
    await db.delete('media', { id: albumId });

    res.json({
      success: true,
      message: 'Album deleted successfully'
    });

  } catch (error) {
    console.error('Delete album error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete photo
router.delete('/photo/:photoId', auth, async (req, res) => {
  try {
    const photoId = req.params.photoId;
    const userId = req.user.id;

    // Verify photo exists and belongs to user
    const photo = await db.query('media', {
      select: 'id, user_id',
      where: { id: photoId, user_id: userId, media_type: 'photo' }
    });

    if (!photo || photo.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Photo not found or access denied'
      });
    }

    await db.delete('media', { id: photoId });

    res.json({
      success: true,
      message: 'Photo deleted successfully'
    });

  } catch (error) {
    console.error('Delete photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
