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
    const { assignments } = req.body;
    
    if (!Array.isArray(assignments) || assignments.length === 0) {
      return res.status(400).json({ error: 'Assignments array is required' });
    }

    const created = [];
    for (const assignment of assignments) {
      const { exchangeId, giverId, recipientId } = assignment;
      
      if (!exchangeId || !giverId || !recipientId) {
        return res.status(400).json({ error: 'Each assignment must have exchangeId, giverId, and recipientId' });
      }

      const result = await db.createAssignment({
        exchangeId,
        giverId,
        recipientId
      });
      
      created.push(result);
    }

    res.status(201).json(created);

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
    const assignments = await db.getAssignmentsByExchangeId(req.params.exchangeId);
    res.json(assignments);

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
