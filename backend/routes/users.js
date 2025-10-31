/**
 * Users Routes
 */

import express from 'express';
import { db } from '../database.js';

const router = express.Router();

/**
 * POST /api/users
 * Create a new user
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, wishList, giftHints, role } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check for duplicate email
    const existing = await db.getUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const user = await db.createUser({
      name,
      email,
      role: role || 'user',
      wishList: wishList || '',
      giftHints: giftHints || ''
    });
    
    res.status(201).json(user);

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

/**
 * GET /api/users/:id
 * Get user by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const user = await db.getUserById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * GET /api/users/email/:email
 * Get user by email
 */
router.get('/email/:email', async (req, res) => {
  try {
    const user = await db.getUserByEmail(req.params.email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Get user by email error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

/**
 * GET /api/users
 * Get all users
 */
router.get('/', async (req, res) => {
  try {
    const users = await db.getAllUsers();
    res.json(users);

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

/**
 * PATCH /api/users/:id
 * Update user
 */
router.patch('/:id', async (req, res) => {
  try {
    const { name, email, wishList, giftHints } = req.body;
    const { id } = req.params;

    const user = await db.getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (wishList !== undefined) updates.wishList = wishList;
    if (giftHints !== undefined) updates.giftHints = giftHints;

    const updated = await db.updateUser(id, updates);
    res.json(updated);

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

/**
 * DELETE /api/users/:id
 * Delete user
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await db.deleteUser(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

export default router;
