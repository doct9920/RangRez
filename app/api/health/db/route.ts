/**
 * Database Health Check Endpoint
 * 
 * GET /api/health/db
 * 
 * Returns database connection status and basic info.
 * Useful for monitoring and deployment verification.
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // Test database connection with a simple query
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;

    // Get database info (PostgreSQL version)
    const versionResult = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version()
    `;
    const version = versionResult[0]?.version || 'Unknown';

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      responseTime: `${responseTime}ms`,
      version: version.split(' ')[0] + ' ' + version.split(' ')[1], // Extract PostgreSQL version
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[DB Health Check] Error:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message || 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

