const express = require('express');
const db = require('../config/database');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all groups (with pagination and search)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search;
    const privacy = req.query.privacy; // 'public', 'private', 'secret'

    let queryOptions = {
      select: `
        *,
        users:created_by(id, username, email),
        profiles:users!created_by(user_id, full_name, avatar_url),
        group_memberships:group_memberships(id, user_id, role, users:user_id(id, username, email), profiles:users!user_id(user_id, full_name, avatar_url))
      `,
      orderBy: { column: 'created_at', ascending: false },
      limit,
      offset
    };

    if (search) {
      // This would need to be implemented with Supabase's text search
      // For now, we'll filter by name
      queryOptions.where = { name: search };
    }

    if (privacy) {
      if (queryOptions.where) {
        queryOptions.where.privacy = privacy;
      } else {
        queryOptions.where = { privacy };
      }
    }

    const groups = await db.query('groups', queryOptions);

    res.json({
      success: true,
      data: {
        groups,
        pagination: {
          page,
          limit,
          total: groups.length
        }
      }
    });

  } catch (error) {
    console.error('Get groups error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single group
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const groupId = req.params.id;

    const group = await db.query('groups', {
      select: `
        *,
        users:created_by(id, username, email),
        profiles:users!created_by(user_id, full_name, avatar_url),
        group_memberships:group_memberships(id, user_id, role, users:user_id(id, username, email), profiles:users!user_id(user_id, full_name, avatar_url)),
        posts:posts(id, content, media_url, privacy, likes_count, comments_count, created_at, users:user_id(id, username, email), profiles:users!user_id(user_id, full_name, avatar_url))
      `,
      where: { id: groupId }
    });

    if (!group || group.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    const groupData = group[0];

    // Check privacy settings
    if (groupData.privacy === 'secret' && (!req.user || !isGroupMember(req.user.id, groupData.group_memberships))) {
      return res.status(403).json({
        success: false,
        message: 'This group is secret and you are not a member'
      });
    }

    res.json({
      success: true,
      data: groupData
    });

  } catch (error) {
    console.error('Get group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new group
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, privacy, coverUrl } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
    }

    const groupData = {
      name,
      description: description || null,
      cover_url: coverUrl || null,
      privacy: privacy || 'public',
      created_by: req.user.id,
      member_count: 1,
      post_count: 0
    };

    const group = await db.insert('groups', groupData);

    // Add creator as owner
    await db.insert('group_memberships', {
      group_id: group.id,
      user_id: req.user.id,
      role: 'owner'
    });

    // Get the created group with user info
    const createdGroup = await db.query('groups', {
      select: `
        *,
        users:created_by(id, username, email),
        profiles:users!created_by(user_id, full_name, avatar_url)
      `,
      where: { id: group.id }
    });

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: createdGroup[0]
    });

  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update group
router.put('/:id', auth, async (req, res) => {
  try {
    const groupId = req.params.id;
    const { name, description, privacy, coverUrl } = req.body;

    // Check if group exists
    const existingGroup = await db.findById('groups', groupId);
    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is owner or admin
    const membership = await db.query('group_memberships', {
      where: { group_id: groupId, user_id: req.user.id }
    });

    if (!membership || membership.length === 0 || !['owner', 'admin'].includes(membership[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit groups where you are an owner or admin'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (privacy !== undefined) updateData.privacy = privacy;
    if (coverUrl !== undefined) updateData.cover_url = coverUrl;

    const updatedGroup = await db.update('groups', groupId, updateData);

    res.json({
      success: true,
      message: 'Group updated successfully',
      data: updatedGroup
    });

  } catch (error) {
    console.error('Update group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete group
router.delete('/:id', auth, async (req, res) => {
  try {
    const groupId = req.params.id;

    // Check if group exists
    const existingGroup = await db.findById('groups', groupId);
    if (!existingGroup) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is owner
    const membership = await db.query('group_memberships', {
      where: { group_id: groupId, user_id: req.user.id, role: 'owner' }
    });

    if (!membership || membership.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete groups where you are the owner'
      });
    }

    await db.delete('groups', groupId);

    res.json({
      success: true,
      message: 'Group deleted successfully'
    });

  } catch (error) {
    console.error('Delete group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Join group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const groupId = req.params.id;

    // Check if group exists
    const group = await db.findById('groups', groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if group is joinable
    if (group.privacy === 'secret') {
      return res.status(403).json({
        success: false,
        message: 'This group is secret and requires an invitation'
      });
    }

    // Check if user is already a member
    const existingMembership = await db.query('group_memberships', {
      where: { group_id: groupId, user_id: req.user.id }
    });

    if (existingMembership && existingMembership.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You are already a member of this group'
      });
    }

    // Add user to group
    await db.insert('group_memberships', {
      group_id: groupId,
      user_id: req.user.id,
      role: 'member'
    });

    // Update member count
    await db.update('groups', groupId, {
      member_count: group.member_count + 1
    });

    res.json({
      success: true,
      message: 'Successfully joined the group'
    });

  } catch (error) {
    console.error('Join group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Leave group
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const groupId = req.params.id;

    // Check if group exists
    const group = await db.findById('groups', groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if user is a member
    const membership = await db.query('group_memberships', {
      where: { group_id: groupId, user_id: req.user.id }
    });

    if (!membership || membership.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'You are not a member of this group'
      });
    }

    // Check if user is owner
    if (membership[0].role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Group owner cannot leave. Transfer ownership or delete the group.'
      });
    }

    // Remove user from group
    await db.delete('group_memberships', membership[0].id);

    // Update member count
    await db.update('groups', groupId, {
      member_count: Math.max(0, group.member_count - 1)
    });

    res.json({
      success: true,
      message: 'Successfully left the group'
    });

  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get group members
router.get('/:id/members', optionalAuth, async (req, res) => {
  try {
    const groupId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const role = req.query.role; // 'owner', 'admin', 'member'

    // Check if group exists
    const group = await db.findById('groups', groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    let queryOptions = {
      select: `
        *,
        users:user_id(id, username, email),
        profiles:users!user_id(user_id, full_name, avatar_url)
      `,
      where: { group_id: groupId },
      orderBy: { column: 'joined_at', ascending: true },
      limit,
      offset
    };

    if (role) {
      queryOptions.where.role = role;
    }

    const members = await db.query('group_memberships', queryOptions);

    res.json({
      success: true,
      data: {
        members,
        pagination: {
          page,
          limit,
          total: members.length
        }
      }
    });

  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update member role (admin only)
router.put('/:id/members/:userId/role', auth, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.params.userId;
    const { role } = req.body;

    if (!['owner', 'admin', 'member'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role must be "owner", "admin", or "member"'
      });
    }

    // Check if group exists
    const group = await db.findById('groups', groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if current user is owner or admin
    const currentMembership = await db.query('group_memberships', {
      where: { group_id: groupId, user_id: req.user.id }
    });

    if (!currentMembership || currentMembership.length === 0 || !['owner', 'admin'].includes(currentMembership[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update roles if you are an owner or admin'
      });
    }

    // Check if target user is a member
    const targetMembership = await db.query('group_memberships', {
      where: { group_id: groupId, user_id: userId }
    });

    if (!targetMembership || targetMembership.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this group'
      });
    }

    // Update role
    await db.update('group_memberships', targetMembership[0].id, {
      role
    });

    res.json({
      success: true,
      message: 'Member role updated successfully'
    });

  } catch (error) {
    console.error('Update member role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Remove member from group (admin only)
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const groupId = req.params.id;
    const userId = req.params.userId;

    // Check if group exists
    const group = await db.findById('groups', groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: 'Group not found'
      });
    }

    // Check if current user is owner or admin
    const currentMembership = await db.query('group_memberships', {
      where: { group_id: groupId, user_id: req.user.id }
    });

    if (!currentMembership || currentMembership.length === 0 || !['owner', 'admin'].includes(currentMembership[0].role)) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove members if you are an owner or admin'
      });
    }

    // Check if target user is a member
    const targetMembership = await db.query('group_memberships', {
      where: { group_id: groupId, user_id: userId }
    });

    if (!targetMembership || targetMembership.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User is not a member of this group'
      });
    }

    // Prevent removing owner
    if (targetMembership[0].role === 'owner') {
      return res.status(400).json({
        success: false,
        message: 'Cannot remove the group owner'
      });
    }

    // Remove member
    await db.delete('group_memberships', targetMembership[0].id);

    // Update member count
    await db.update('groups', groupId, {
      member_count: Math.max(0, group.member_count - 1)
    });

    res.json({
      success: true,
      message: 'Member removed successfully'
    });

  } catch (error) {
    console.error('Remove member error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Helper function to check if user is a group member
function isGroupMember(userId, memberships) {
  return memberships && memberships.some(membership => membership.user_id === userId);
}

module.exports = router;
