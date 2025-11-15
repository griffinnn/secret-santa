/**
 * Assignments Routes
 */

import express from 'express';
import { db } from '../database.js';

const router = express.Router();

/**
 * POST /api/assignments
 * Create assignments (batch)
 */
router.post('/', async (req, res) => {
  try {
    // Support both batch and single assignment payloads
    if (Array.isArray(req.body.assignments)) {
      const assignments = req.body.assignments;
      if (assignments.length === 0) {
        return res.status(400).json({ error: 'Assignments array cannot be empty' });
      }
      const created = [];
      for (const assignment of assignments) {
        const { exchangeId, giverId, recipientId } = assignment;
        if (!exchangeId || !giverId || !recipientId) {
          return res.status(400).json({ error: 'Each assignment must have exchangeId, giverId, and recipientId' });
        }
        const result = await db.createAssignment({ exchangeId, giverId, recipientId });
        created.push(result);
      }
      return res.status(201).json(created);
    }

    // Single assignment form { exchangeId, giverId, recipientId }
    const { exchangeId, giverId, recipientId } = req.body;
    if (!exchangeId || !giverId || !recipientId) {
      return res.status(400).json({ error: 'exchangeId, giverId and recipientId are required' });
    }
    const created = await db.createAssignment({ exchangeId, giverId, recipientId });
    return res.status(201).json(created);

  } catch (error) {
    console.error('Create assignments error:', error);
    res.status(500).json({ error: 'Failed to create assignments' });
  }
});

/**
 * GET /api/assignments/exchange/:exchangeId
 * Get all assignments for an exchange
 */
router.get('/exchange/:exchangeId', async (req, res) => {
  try {
    const { exchangeId } = req.params;
    const { requesterId } = req.query;

    if (!requesterId) {
      return res.status(400).json({ error: 'requesterId query parameter is required' });
    }

    const exchange = await db.getExchangeById(exchangeId);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    const requester = await db.getUserById(requesterId);
    if (!requester) {
      return res.status(404).json({ error: 'Requester not found' });
    }

    const isAdmin = requester.role === 'admin';
    const isCreator = exchange.createdBy === requesterId || exchange.creatorId === requesterId;

    if (isAdmin || isCreator) {
      const assignments = await db.getAssignmentsByExchangeId(exchangeId);
      return res.json(assignments);
    }

    const participants = await db.getParticipantsByExchangeId(exchangeId);
    const participantIds = participants.map((participant) => participant.userId);
    if (!participantIds.includes(requesterId)) {
      return res.status(403).json({ error: 'Not authorized to view assignments for this exchange' });
    }

    const assignment = await db.getAssignmentForGiver(exchangeId, requesterId);
    if (!assignment) {
      return res.json([]);
    }

    return res.json([assignment]);

  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

/**
 * GET /api/assignments/giver/:giverId/exchange/:exchangeId
 * Get assignment for a specific giver in an exchange
 */
router.get('/giver/:giverId/exchange/:exchangeId', async (req, res) => {
  try {
    const { giverId, exchangeId } = req.params;
    const assignment = await db.getAssignmentForGiver(exchangeId, giverId);
    
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json(assignment);

  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Failed to get assignment' });
  }
});

/**
 * GET /api/assignments/recipient/:recipientId/exchange/:exchangeId
 * Get assignments where user is the recipient
 */
router.get('/recipient/:recipientId/exchange/:exchangeId', async (req, res) => {
  try {
    const { recipientId, exchangeId } = req.params;
    const assignments = await db.getAssignmentsForRecipient(exchangeId, recipientId);
    
    res.json(assignments);

  } catch (error) {
    console.error('Get recipient assignments error:', error);
    res.status(500).json({ error: 'Failed to get assignments' });
  }
});

/**
 * DELETE /api/assignments/:id
 * Delete an assignment
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db.deleteAssignment(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deleted successfully' });

  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

export default router;
