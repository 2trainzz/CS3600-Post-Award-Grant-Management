/**
 * Authentication Service
 * 
 * Handles user authentication business logic:
 * - User registration
 * - User login
 * - Password hashing and verification
 * - Token generation
 */

import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { generateToken } from '../utils/jwt';
import { 
  UnauthorizedError, 
  ConflictError, 
  BadRequestError 
} from '../utils/errors';
import { logger } from '../utils/logger';

// Number of salt rounds for bcrypt hashing
const SALT_ROUNDS = 10;

/**
 * User registration data
 */
interface RegisterData {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Login credentials
 */
interface LoginData {
  username: string;
  password: string;
}

/**
 * Authentication response with token and user info
 */
interface AuthResponse {
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    department: string;
  };
}

/**
 * Register a new user
 * 
 * @param data - User registration data
 * @returns Auth response with token and user info
 * @throws ConflictError if username or email already exists
 */
export async function register(data: RegisterData): Promise<AuthResponse> {
  logger.info('User registration attempt', { username: data.username });

  // Check if username already exists
  const existingUser = await prisma.user.findUnique({
    where: { username: data.username },
  });

  if (existingUser) {
    throw new ConflictError('Username already taken');
  }

  // Check if email already exists
  const existingEmail = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingEmail) {
    throw new ConflictError('Email already registered');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

  // Create the user
  const user = await prisma.user.create({
    data: {
      username: data.username,
      password: hashedPassword,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'user', // Default role
      department: 'computer science', // Default department
    },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      department: true,
    },
  });

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  logger.info('User registered successfully', { 
    userId: user.id, 
    username: user.username 
  });

  return {
    token,
    user,
  };
}

/**
 * Authenticate user and generate token
 * 
 * @param data - Login credentials
 * @returns Auth response with token and user info
 * @throws UnauthorizedError if credentials are invalid
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  logger.info('Login attempt', { username: data.username });

  // Find user by username
  const user = await prisma.user.findUnique({
    where: { username: data.username },
  });

  if (!user) {
    // Don't reveal whether username exists for security
    throw new UnauthorizedError('Invalid username or password');
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(data.password, user.password);

  if (!isValidPassword) {
    throw new UnauthorizedError('Invalid username or password');
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    username: user.username,
    role: user.role,
  });

  logger.info('User logged in successfully', { 
    userId: user.id, 
    username: user.username 
  });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
    },
  };
}

/**
 * Change user password
 * 
 * @param userId - User ID
 * @param currentPassword - Current password for verification
 * @param newPassword - New password to set
 * @throws UnauthorizedError if current password is incorrect
 */
export async function changePassword(
  userId: number,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  logger.info('Password change attempt', { userId });

  // Fetch user with password
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password);

  if (!isValidPassword) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  logger.info('Password changed successfully', { userId });
}

/**
 * Get user profile by ID
 * 
 * @param userId - User ID
 * @returns User profile without password
 */
export async function getUserProfile(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      department: true,
    },
  });

  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  return user;
}