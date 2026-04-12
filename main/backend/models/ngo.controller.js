// backend/models/ngo.controller.js
// NOTE: This file lives in /models/ but acts as a controller (attendance + review helpers).
// It is imported by ngo.routes.js alongside the main ngo.controller.js.

const Application = require('../models/application.model');
const Opportunity = require('../models/opportunity.model');

// Safe ownership check that works for both Mongoose ObjectId and plain string IDs
const isOwner = (ownerId, userId) => String(ownerId) === String(userId);

// Minimal native CSV builder — avoids the json2csv dependency which is not installed
const toCSV = (rows) => {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
  return [
    headers.map(escape).join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(','))
  ].join('\n');
};

// ---------------------------
// 1. Review Application
// ---------------------------
const reviewApplication = async (req, res) => {
  const { eventId, registrationId } = req.params;
  const { status, reviewMessage } = req.body;
  const userId = req.user._id || req.user.id;

  try {
    if (!['accepted', 'rejected', 'withdrawn'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const opportunity = await Opportunity.findById(eventId);
    if (!opportunity) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!isOwner(opportunity.createdBy, userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const application = await Application.findById(registrationId);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    application.status = status;
    application.reviewMessage = reviewMessage || '';
    application.reviewedAt = new Date();
    application.reviewedBy = userId;

    await application.save();
    res.json({ success: true, application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------------------
// 2. Mark Attendance
// ---------------------------
const markAttendance = async (req, res) => {
  const { eventId, volunteerId } = req.params;
  const { status, arrivalTime, notes } = req.body;
  const userId = req.user._id || req.user.id;

  try {
    const opportunity = await Opportunity.findById(eventId);
    if (!opportunity) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!isOwner(opportunity.createdBy, userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const application = await Application.findOne({ opportunityId: eventId, volunteerId });
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    application.attendance = {
      status,
      markedAt: new Date(),
      markedBy: userId,
      arrivalTime: arrivalTime || null,
      notes: notes || ''
    };

    await application.save();
    res.json({ success: true, application });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------------------
// 3. Mark All Present
// ---------------------------
const markAllPresent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id || req.user.id;

  try {
    const opportunity = await Opportunity.findById(eventId);
    if (!opportunity) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!isOwner(opportunity.createdBy, userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const result = await Application.updateMany(
      { opportunityId: eventId, status: 'accepted' },
      {
        $set: {
          'attendance.status': 'present',
          'attendance.markedAt': new Date(),
          'attendance.markedBy': userId
        }
      }
    );

    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ---------------------------
// 4. Export Attendance CSV
// ---------------------------
const exportAttendanceReport = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user._id || req.user.id;

  try {
    const opportunity = await Opportunity.findById(eventId);
    if (!opportunity) return res.status(404).json({ success: false, message: 'Event not found' });
    if (!isOwner(opportunity.createdBy, userId)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const applications = await Application.find({ opportunityId: eventId })
      .populate('volunteerId', 'name email')
      .populate('reviewedBy', 'name email');

    const data = applications.map(app => ({
      Volunteer: app.volunteerId?.name || '',
      Email: app.volunteerId?.email || '',
      ApplicationStatus: app.status,
      ReviewMessage: app.reviewMessage || '',
      ReviewedBy: app.reviewedBy ? app.reviewedBy.name : '',
      AttendanceStatus: app.attendance?.status || '',
      ArrivalTime: app.attendance?.arrivalTime || '',
      Notes: app.attendance?.notes || '',
      MarkedAt: app.attendance?.markedAt ? app.attendance.markedAt.toISOString() : ''
    }));

    const csv = toCSV(data);
    res.header('Content-Type', 'text/csv');
    res.attachment(`attendance_report_${eventId}.csv`);
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  reviewApplication,
  markAttendance,
  markAllPresent,
  exportAttendanceReport
};
