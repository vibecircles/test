const express = require('express');
const db = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get user settings
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const settings = await db.query(`
      SELECT 
        us.*,
        u.username,
        u.email,
        p.full_name,
        p.avatar_url,
        p.cover_url,
        p.bio,
        p.location,
        p.website,
        p.gender,
        p.phone,
        p.birthday,
        p.privacy as profile_privacy
      FROM user_settings us
      INNER JOIN users u ON us.user_id = u.id
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE us.user_id = ?
    `, [userId]);

    if (!settings.length) {
      return res.status(404).json({
        success: false,
        message: 'User settings not found'
      });
    }

    res.json({
      success: true,
      data: settings[0]
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user settings'
    });
  }
});

// Update user settings
router.put('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      email_notifications,
      push_notifications,
      profile_visibility,
      post_visibility,
      theme,
      language,
      timezone,
      // Profile fields
      full_name,
      bio,
      location,
      website,
      gender,
      phone,
      birthday,
      profile_privacy
    } = req.body;

    // Update user settings
    const settingsData = {};
    if (email_notifications !== undefined) settingsData.email_notifications = email_notifications;
    if (push_notifications !== undefined) settingsData.push_notifications = push_notifications;
    if (profile_visibility !== undefined) settingsData.profile_visibility = profile_visibility;
    if (post_visibility !== undefined) settingsData.post_visibility = post_visibility;
    if (theme !== undefined) settingsData.theme = theme;
    if (language !== undefined) settingsData.language = language;
    if (timezone !== undefined) settingsData.timezone = timezone;

    if (Object.keys(settingsData).length > 0) {
      await db.update('user_settings', userId, settingsData, 'user_id');
    }

    // Update profile if profile fields are provided
    const profileData = {};
    if (full_name !== undefined) profileData.full_name = full_name;
    if (bio !== undefined) profileData.bio = bio;
    if (location !== undefined) profileData.location = location;
    if (website !== undefined) profileData.website = website;
    if (gender !== undefined) profileData.gender = gender;
    if (phone !== undefined) profileData.phone = phone;
    if (birthday !== undefined) profileData.birthday = birthday;
    if (profile_privacy !== undefined) profileData.privacy = profile_privacy;

    if (Object.keys(profileData).length > 0) {
      await db.update('profiles', userId, profileData, 'user_id');
    }

    // Get updated settings
    const updatedSettings = await db.query(`
      SELECT 
        us.*,
        u.username,
        u.email,
        p.full_name,
        p.avatar_url,
        p.cover_url,
        p.bio,
        p.location,
        p.website,
        p.gender,
        p.phone,
        p.birthday,
        p.privacy as profile_privacy
      FROM user_settings us
      INNER JOIN users u ON us.user_id = u.id
      INNER JOIN profiles p ON u.id = p.user_id
      WHERE us.user_id = ?
    `, [userId]);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: updatedSettings[0]
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user settings'
    });
  }
});

// Update avatar
router.put('/avatar', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { avatar_url } = req.body;

    if (!avatar_url) {
      return res.status(400).json({
        success: false,
        message: 'Avatar URL is required'
      });
    }

    await db.update('profiles', userId, { avatar_url }, 'user_id');

    res.json({
      success: true,
      message: 'Avatar updated successfully',
      data: { avatar_url }
    });
  } catch (error) {
    console.error('Error updating avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update avatar'
    });
  }
});

// Update cover photo
router.put('/cover', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { cover_url } = req.body;

    if (!cover_url) {
      return res.status(400).json({
        success: false,
        message: 'Cover URL is required'
      });
    }

    await db.update('profiles', userId, { cover_url }, 'user_id');

    res.json({
      success: true,
      message: 'Cover photo updated successfully',
      data: { cover_url }
    });
  } catch (error) {
    console.error('Error updating cover photo:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cover photo'
    });
  }
});

// Get notification settings
router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const settings = await db.query(`
      SELECT 
        email_notifications,
        push_notifications,
        profile_visibility,
        post_visibility
      FROM user_settings 
      WHERE user_id = ?
    `, [userId]);

    if (!settings.length) {
      return res.status(404).json({
        success: false,
        message: 'User settings not found'
      });
    }

    res.json({
      success: true,
      data: settings[0]
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification settings'
    });
  }
});

// Update notification settings
router.put('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      email_notifications,
      push_notifications,
      profile_visibility,
      post_visibility
    } = req.body;

    const settingsData = {};
    if (email_notifications !== undefined) settingsData.email_notifications = email_notifications;
    if (push_notifications !== undefined) settingsData.push_notifications = push_notifications;
    if (profile_visibility !== undefined) settingsData.profile_visibility = profile_visibility;
    if (post_visibility !== undefined) settingsData.post_visibility = post_visibility;

    if (Object.keys(settingsData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No settings provided for update'
      });
    }

    await db.update('user_settings', userId, settingsData, 'user_id');

    res.json({
      success: true,
      message: 'Notification settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification settings'
    });
  }
});

// Get theme and display settings
router.get('/display', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const settings = await db.query(`
      SELECT 
        theme,
        language,
        timezone
      FROM user_settings 
      WHERE user_id = ?
    `, [userId]);

    if (!settings.length) {
      return res.status(404).json({
        success: false,
        message: 'User settings not found'
      });
    }

    res.json({
      success: true,
      data: settings[0]
    });
  } catch (error) {
    console.error('Error fetching display settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch display settings'
    });
  }
});

// Update theme and display settings
router.put('/display', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { theme, language, timezone } = req.body;

    const settingsData = {};
    if (theme !== undefined) settingsData.theme = theme;
    if (language !== undefined) settingsData.language = language;
    if (timezone !== undefined) settingsData.timezone = timezone;

    if (Object.keys(settingsData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No display settings provided for update'
      });
    }

    await db.update('user_settings', userId, settingsData, 'user_id');

    res.json({
      success: true,
      message: 'Display settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating display settings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update display settings'
    });
  }
});

module.exports = router;
