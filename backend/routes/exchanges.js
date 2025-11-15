/**
 * Exchanges Routes
 */

import express from 'express';
import { db } from '../database.js';

const router = express.Router();

/**
 * Helper: Get full exchange data with participants and pending
 */
async function getFullExchange(exchangeId) {
  const exchange = await db.getExchangeById(exchangeId);
  if (!exchange) return null;

  // Get participants
  const participants = await db.getParticipantsByExchangeId(exchangeId);
  const participantIds = participants.map(p => p.userId);

  // Get pending participants
  const pending = await db.getPendingParticipantsByExchangeId(exchangeId);
  const pendingData = pending.map(p => ({
    id: p.id,
    userId: p.userId,
    requestedAt: p.requestedAt
  }));

  return {
    ...exchange,
    participants: participantIds,
    pendingParticipants: pendingData
  };
}

/**
 * POST /api/exchanges
 * Create a new exchange
 */
router.post('/', async (req, res) => {
  try {
    const { name, giftBudget, createdBy, startDate, endDate } = req.body;
    
    if (!name || !giftBudget || !createdBy) {
      return res.status(400).json({ error: 'Name, budget, and creator are required' });
    }

    const exchange = await db.createExchange({
      name,
      giftBudget,
      createdBy,
      startDate: startDate || null,
      endDate: endDate || null,
      status: 'active',
      assignmentsGenerated: false
    });

    // Add creator as first participant
    await db.addParticipant({
      exchangeId: exchange.id,
      userId: createdBy
    });

    const fullExchange = await getFullExchange(exchange.id);
    res.status(201).json(fullExchange);

  } catch (error) {
    console.error('Create exchange error:', error);
    res.status(500).json({ error: 'Failed to create exchange' });
  }
});

/**
 * POST /api/exchanges/:id/generate-assignments
 * Generate Secret Santa assignments for an exchange
 */
router.post('/:id/generate-assignments', async (req, res) => {
  try {
    const exchangeId = req.params.id;
    const exchange = await db.getExchangeById(exchangeId);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    // Get approved participants
    const participants = await db.getParticipantsByExchangeId(exchangeId);
    const userIds = participants.map(p => p.userId);

    if (userIds.length < 3) {
      return res.status(400).json({ error: 'At least 3 participants are required to generate assignments' });
    }

    // Prevent regenerate if already generated (simple guard)
    if (exchange.assignmentsGenerated) {
      return res.status(409).json({ error: 'Assignments already generated for this exchange' });
    }

    // Sattolo's algorithm to create a single cycle (derangement)
    const recipients = [...userIds];
    for (let i = recipients.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * i); // 0 <= j < i
      [recipients[i], recipients[j]] = [recipients[j], recipients[i]];
    }
    // Ensure no fixed points; if any, do a simple swap fix pass
    for (let i = 0; i < userIds.length; i++) {
      if (userIds[i] === recipients[i]) {
        const swapWith = (i + 1) % userIds.length;
        [recipients[i], recipients[swapWith]] = [recipients[swapWith], recipients[i]];
      }
    }

    // Persist assignments
    const created = [];
    for (let i = 0; i < userIds.length; i++) {
      const giverId = userIds[i];
      const recipientId = recipients[i];
      if (giverId === recipientId) {
        return res.status(500).json({ error: 'Failed to generate valid assignments, please retry' });
      }
      const a = await db.createAssignment({ exchangeId, giverId, recipientId });
      created.push(a);
    }

    // Mark exchange as having generated assignments
    await db.updateExchange(exchangeId, { assignmentsGenerated: true });

    const fullExchange = await getFullExchange(exchangeId);
    return res.status(201).json({
      message: 'Assignments generated',
      exchange: fullExchange,
      assignments: created
    });

  } catch (error) {
    console.error('Generate assignments error:', error);
    return res.status(500).json({ error: 'Failed to generate assignments' });
  }
});

/**
 * GET /api/exchanges/:id
 * Get exchange by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const exchange = await getFullExchange(req.params.id);
    
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    res.json(exchange);

  } catch (error) {
    console.error('Get exchange error:', error);
    res.status(500).json({ error: 'Failed to get exchange' });
  }
});

/**
 * GET /api/exchanges
 * Get all exchanges
 */
router.get('/', async (req, res) => {
  try {
    const exchanges = await db.getAllExchanges();
    const fullExchanges = await Promise.all(
      exchanges.map(e => getFullExchange(e.id))
    );
    res.json(fullExchanges);

  } catch (error) {
    console.error('Get exchanges error:', error);
    res.status(500).json({ error: 'Failed to get exchanges' });
  }
});

/**
 * GET /api/exchanges/user/:userId
 * Get exchanges for a specific user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const exchanges = await db.getExchangesByUserId(req.params.userId);
    const fullExchanges = await Promise.all(
      exchanges.map(e => getFullExchange(e.id))
    );
    res.json(fullExchanges);

  } catch (error) {
    console.error('Get user exchanges error:', error);
    res.status(500).json({ error: 'Failed to get user exchanges' });
  }
});

/**
 * PATCH /api/exchanges/:id
 * Update exchange
 */
router.patch('/:id', async (req, res) => {
  try {
    const { name, giftBudget, startDate, endDate, status, assignmentsGenerated } = req.body;
    const { id } = req.params;

    const exchange = await db.getExchangeById(id);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (giftBudget !== undefined) updates.giftBudget = giftBudget;
    if (startDate !== undefined) updates.startDate = startDate;
    if (endDate !== undefined) updates.endDate = endDate;
    if (status !== undefined) updates.status = status;
    if (assignmentsGenerated !== undefined) updates.assignmentsGenerated = assignmentsGenerated;

    await db.updateExchange(id, updates);
    const fullExchange = await getFullExchange(id);
    res.json(fullExchange);

  } catch (error) {
    console.error('Update exchange error:', error);
    res.status(500).json({ error: 'Failed to update exchange' });
  }
});

/**
 * POST /api/exchanges/:id/request-join
 * Request to join an exchange
 */
router.post('/:id/request-join', async (req, res) => {
  try {
    const { userId } = req.body;
    const { id: exchangeId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const exchange = await db.getExchangeById(exchangeId);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    // Check if already a participant
    const existing = await db.getParticipant(exchangeId, userId);
    if (existing) {
      return res.status(409).json({ error: 'User is already a participant' });
    }

    // Check if already pending
    const pending = await db.getPendingParticipant(exchangeId, userId);
    if (pending) {
      return res.status(409).json({ error: 'Join request already pending' });
    }

    // Add to pending
    await db.addPendingParticipant({
      exchangeId,
      userId
    });

    const fullExchange = await getFullExchange(exchangeId);
    res.json(fullExchange);

  } catch (error) {
    console.error('Request join error:', error);
    res.status(500).json({ error: 'Failed to request join' });
  }
});

/**
 * POST /api/exchanges/:id/approve-participant
 * Approve a pending participant
 */
router.post('/:id/approve-participant', async (req, res) => {
  try {
    const { userId } = req.body;
    const { id: exchangeId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const exchange = await db.getExchangeById(exchangeId);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    // Check if pending
    const pending = await db.getPendingParticipant(exchangeId, userId);
    if (!pending) {
      return res.status(404).json({ error: 'No pending request found' });
    }

    // Remove from pending
    await db.removePendingParticipant(exchangeId, userId);

    // Add as participant
    await db.addParticipant({
      exchangeId,
      userId
    });

    const fullExchange = await getFullExchange(exchangeId);
    res.json(fullExchange);

  } catch (error) {
    console.error('Approve participant error:', error);
    res.status(500).json({ error: 'Failed to approve participant' });
  }
});

/**
 * POST /api/exchanges/:id/decline-participant
 * Decline a pending participant
 */
router.post('/:id/decline-participant', async (req, res) => {
  try {
    const { userId } = req.body;
    const { id: exchangeId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const exchange = await db.getExchangeById(exchangeId);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    // Remove from pending
    const removed = await db.removePendingParticipant(exchangeId, userId);
    if (!removed) {
      return res.status(404).json({ error: 'No pending request found' });
    }

    const fullExchange = await getFullExchange(exchangeId);
    res.json(fullExchange);

  } catch (error) {
    console.error('Decline participant error:', error);
    res.status(500).json({ error: 'Failed to decline participant' });
  }
});

/**
 * DELETE /api/exchanges/:id
 * Delete exchange
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db.deleteExchange(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    res.json({ message: 'Exchange deleted successfully' });

  } catch (error) {
    console.error('Delete exchange error:', error);
    res.status(500).json({ error: 'Failed to delete exchange' });
  }
});

export default router;
