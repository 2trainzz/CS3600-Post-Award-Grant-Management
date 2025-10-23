/**
 * Authentication Service
 * 
 * Extracted from your original server.ts
 * Handles user registration and login - SAME LOGIC, just organized
 */

import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { createSession, deleteSession } from '../utils/sessionManager';
import { logger } from '../utils/logger';

/**
 * Register a new user
 * (Exact same logic as your original code)
 */
export async function register(data: {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  logger.info('User registration attempt', { username: data.username });

  // Hash password (same as before)
  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user (same as before)
  const user = await prisma.user.create({
    data: {
      username: data.username,
      password: hashedPassword,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  });

  logger.info('User registered successfully', { userId: user.id });

  return { user };
}

/**
 * Login user and create session
 * (Exact same logic as your original code)
 */
export async function login(data: {
  username: string;
  password: string;
}) {
  logger.info('Login attempt', { username: data.username });

  // Find user (same as before)
  const user = await prisma.user.findUnique({
    where: { username: data.username },
  });

  // Check if user exists and password matches (same as before)
  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    throw new Error('Invalid credentials');
  }

  // Create session and generate token (same as before)
  const token = createSession(user.id);

  logger.info('User logged in successfully', { userId: user.id });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  };
}

/**
 * Logout user (delete session)
 */
export async function logout(token: string) {
  const { deleteSession } = await import('../utils/sessionManager');
  deleteSession(token);
  logger.info('User logged out');
}