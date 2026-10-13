/**
 * Database User Functions
 * 
 * This module provides database-backed user functions.
 * Replaces in-memory user store with PostgreSQL queries.
 * 
 * Phase: User Authentication Database Integration
 */

import { prisma } from '@/lib/prisma';
import { User, UserRole } from '@/lib/users';
import bcrypt from 'bcryptjs';

/**
 * Convert Prisma User to User interface
 */
function prismaToUser(prismaUser: any): User {
  return {
    id: prismaUser.id,
    email: prismaUser.email,
    phone: prismaUser.phone || undefined,
    name: prismaUser.name,
    passwordHash: prismaUser.passwordHash,
    role: prismaUser.role as UserRole,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
  };
}

/**
 * Get user by email from database
 */
export async function getUserByEmailFromDB(email: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    return user ? prismaToUser(user) : null;
  } catch (error) {
    console.error(`[users-db.ts] Error fetching user by email ${email}:`, error);
    return null;
  }
}

/**
 * Get user by ID from database
 */
export async function getUserByIdFromDB(id: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? prismaToUser(user) : null;
  } catch (error) {
    console.error(`[users-db.ts] Error fetching user by ID ${id}:`, error);
    return null;
  }
}

/**
 * Create user in database
 */
export async function createUserInDB(data: {
  email: string;
  phone?: string;
  name: string;
  password: string;
  role?: UserRole;
}): Promise<User> {
  try {
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        phone: data.phone,
        name: data.name,
        passwordHash,
        role: data.role || 'customer',
      },
    });

    return prismaToUser(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      // Unique constraint violation (email already exists)
      throw new Error('User with this email already exists');
    }
    console.error('[users-db.ts] Error creating user:', error);
    throw error;
  }
}

/**
 * Update user in database
 */
export async function updateUserInDB(
  id: string,
  data: Partial<Omit<User, 'id' | 'passwordHash' | 'createdAt'>> & { password?: string }
): Promise<User | null> {
  try {
    // If email is being updated, check if new email already exists
    if (data.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      if (existing && existing.id !== id) {
        throw new Error('User with this email already exists');
      }
    }

    // Prepare update data
    const updateData: any = {
      ...(data.email && { email: data.email.toLowerCase() }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.name && { name: data.name }),
      ...(data.role && { role: data.role }),
    };

    // If password is provided, hash it
    if (data.password && data.password.trim()) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return prismaToUser(updated);
  } catch (error: any) {
    if (error.code === 'P2025') {
      // Record not found
      return null;
    }
    if (error.code === 'P2002') {
      // Unique constraint violation
      throw new Error('User with this email already exists');
    }
    console.error(`[users-db.ts] Error updating user ${id}:`, error);
    throw error;
  }
}

/**
 * Get all users from database (for admin)
 */
export async function getAllUsersFromDB(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users.map(prismaToUser);
  } catch (error) {
    console.error('[users-db.ts] Error fetching all users:', error);
    throw error;
  }
}

/**
 * Verify password against user's password hash
 */
export async function verifyPasswordFromDB(user: User, password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, user.passwordHash);
  } catch (error) {
    console.error('[users-db.ts] Error verifying password:', error);
    return false;
  }
}

