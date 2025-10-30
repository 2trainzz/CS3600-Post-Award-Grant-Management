//auth.service - handles user registration and login

import bcrypt from 'bcrypt';
import prisma from '../prisma';
import { createSession, deleteSession } from '../utils/sessionManager';
import { logger } from '../utils/logger';

//register new user
export async function register(data: {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  logger.info('User registration attempt', { username: data.username });

  const hashedPassword = await bcrypt.hash(data.password, 10);

  //create user
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

//login user and create session
export async function login(data: {
  username: string;
  password: string;
}) {
  logger.info('Login attempt', { username: data.username });

  //find user
  const user = await prisma.user.findUnique({
    where: { username: data.username },
  });

  //check user exists and password matches
  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    throw new Error('Invalid credentials');
  }

  //create session and generate token
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

//logout (delete session)
export async function logout(token: string) {
  const { deleteSession } = await import('../utils/sessionManager');
  deleteSession(token);
  logger.info('User logged out');
}