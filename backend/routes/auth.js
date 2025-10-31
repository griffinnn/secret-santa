/**
 * Auth Routes
 */

import express from 'express';
import { db } from '../database.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Login user (email-based, passwordless)
 */
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await db.getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

/**
 * POST /api/auth/logout
 * Logout user (client-side only, no server state)
 */
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

export default router;
