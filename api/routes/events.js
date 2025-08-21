const express = require('express');
const db = require('../config/database');
const { auth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all events (with pagination and filters)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const groupId = req.query.groupId;
    const upcoming = req.query.upcoming === 'true';

    let queryOptions = {
      select: `
        *,
        users:created_by(id, username, email),
        profiles:users!created_by(user_id, full_name, avatar_url),
        groups:group_id(id, name, description, cover_url),
        event_attendees:event_attendees(id, user_id, status, users:user_id(id, username, email), profiles:users!user_id(user_id, full_name, avatar_url))
      `,
      orderBy: { column: 'start_date', ascending: true },
      limit,
      offset
    };

    if (groupId) {
      queryOptions.where = { group_id: groupId };
    }

    if (upcoming) {
      // Filter for events starting from now
      const now = new Date().toISOString();
      // This would need to be implemented with Supabase's date filtering
      // For now, we'll get all events and filter in the application
    }

    const events = await db.query('events', queryOptions);

    // Filter upcoming events if requested
    let filteredEvents = events;
    if (upcoming) {
      const now = new Date();
      filteredEvents = events.filter(event => new Date(event.start_date) >= now);
    }

    res.json({
      success: true,
      data: {
        events: filteredEvents,
        pagination: {
          page,
          limit,
          total: filteredEvents.length
        }
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single event
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const eventId = req.params.id;

    const event = await db.query('events', {
      select: `
        *,
        users:created_by(id, username, email),
        profiles:users!created_by(user_id, full_name, avatar_url),
        groups:group_id(id, name, description, cover_url),
        event_attendees:event_attendees(id, user_id, status, users:user_id(id, username, email), profiles:users!user_id(user_id, full_name, avatar_url))
      `,
      where: { id: eventId }
    });

    if (!event || event.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event[0]
    });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, location, startDate, endDate, groupId, privacy, maxAttendees, coverUrl } = req.body;

    if (!title || !startDate) {
      return res.status(400).json({
        success: false,
        message: 'Title and start date are required'
      });
    }

    const eventData = {
      title,
      description: description || null,
      location: location || null,
      start_date: startDate,
      end_date: endDate || null,
      created_by: req.user.id,
      group_id: groupId || null,
      privacy: privacy || 'public',
      max_attendees: maxAttendees || null,
      cover_url: coverUrl || null
    };

    const event = await db.insert('events', eventData);

    // Get the created event with user and group info
    const createdEvent = await db.query('events', {
      select: `
        *,
        users:created_by(id, username, email),
        profiles:users!created_by(user_id, full_name, avatar_url),
        groups:group_id(id, name, description, cover_url)
      `,
      where: { id: event.id }
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: createdEvent[0]
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update event
router.put('/:id', auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { title, description, location, startDate, endDate, privacy, maxAttendees, coverUrl } = req.body;

    // Check if event exists and belongs to user
    const existingEvent = await db.findById('events', eventId);
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (existingEvent.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit events you created'
      });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (startDate !== undefined) updateData.start_date = startDate;
    if (endDate !== undefined) updateData.end_date = endDate;
    if (privacy !== undefined) updateData.privacy = privacy;
    if (maxAttendees !== undefined) updateData.max_attendees = maxAttendees;
    if (coverUrl !== undefined) updateData.cover_url = coverUrl;

    const updatedEvent = await db.update('events', eventId, updateData);

    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete event
router.delete('/:id', auth, async (req, res) => {
  try {
    const eventId = req.params.id;

    // Check if event exists and belongs to user
    const existingEvent = await db.findById('events', eventId);
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (existingEvent.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete events you created'
      });
    }

    await db.delete('events', eventId);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// RSVP to event
router.post('/:id/rsvp', auth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const { status } = req.body; // 'going', 'maybe', 'not_going'

    if (!['going', 'maybe', 'not_going'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "going", "maybe", or "not_going"'
      });
    }

    // Check if event exists
    const event = await db.findById('events', eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user already RSVP'd
    const existingRSVP = await db.query('event_attendees', {
      where: { event_id: eventId, user_id: req.user.id }
    });

    if (existingRSVP && existingRSVP.length > 0) {
      // Update existing RSVP
      await db.update('event_attendees', existingRSVP[0].id, {
        status
      });
    } else {
      // Create new RSVP
      await db.insert('event_attendees', {
        event_id: eventId,
        user_id: req.user.id,
        status
      });
    }

    res.json({
      success: true,
      message: `RSVP updated to ${status}`,
      data: { status }
    });

  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get upcoming birthdays
router.get('/birthdays/upcoming', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 30; // Next 30 days

    // Get current date and future date
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    // Get profiles with birthdays in the next X days
    // This is a simplified approach - in production you'd want to use proper date functions
    const profiles = await db.query('profiles', {
      select: `
        *,
        users:user_id(id, username, email)
      `,
      where: { 
        birthday: {
          // This would need proper date range filtering in Supabase
          // For now, we'll get all profiles and filter in the application
        }
      },
      limit
    });

    // Filter profiles with birthdays in the next X days
    const upcomingBirthdays = profiles.filter(profile => {
      if (!profile.birthday) return false;
      
      const birthday = new Date(profile.birthday);
      const birthdayThisYear = new Date(now.getFullYear(), birthday.getMonth(), birthday.getDate());
      
      // If birthday has passed this year, check next year
      if (birthdayThisYear < now) {
        birthdayThisYear.setFullYear(now.getFullYear() + 1);
      }
      
      return birthdayThisYear >= now && birthdayThisYear <= futureDate;
    });

    // Sort by birthday date
    upcomingBirthdays.sort((a, b) => {
      const birthdayA = new Date(a.birthday);
      const birthdayB = new Date(b.birthday);
      const birthdayAThisYear = new Date(now.getFullYear(), birthdayA.getMonth(), birthdayA.getDate());
      const birthdayBThisYear = new Date(now.getFullYear(), birthdayB.getMonth(), birthdayB.getDate());
      
      if (birthdayAThisYear < now) birthdayAThisYear.setFullYear(now.getFullYear() + 1);
      if (birthdayBThisYear < now) birthdayBThisYear.setFullYear(now.getFullYear() + 1);
      
      return birthdayAThisYear - birthdayBThisYear;
    });

    res.json({
      success: true,
      data: {
        birthdays: upcomingBirthdays.slice(0, limit),
        total: upcomingBirthdays.length
      }
    });

  } catch (error) {
    console.error('Get upcoming birthdays error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get event attendees
router.get('/:id/attendees', optionalAuth, async (req, res) => {
  try {
    const eventId = req.params.id;
    const status = req.query.status; // 'going', 'maybe', 'not_going'

    // Check if event exists
    const event = await db.findById('events', eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    let queryOptions = {
      select: `
        *,
        users:user_id(id, username, email),
        profiles:users!user_id(user_id, full_name, avatar_url)
      `,
      where: { event_id: eventId },
      orderBy: { column: 'created_at', ascending: true }
    };

    if (status) {
      queryOptions.where.status = status;
    }

    const attendees = await db.query('event_attendees', queryOptions);

    res.json({
      success: true,
      data: attendees
    });

  } catch (error) {
    console.error('Get event attendees error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
