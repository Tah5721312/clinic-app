import { NextResponse } from 'next/server';
import { checkDatabaseConnection, getConnection } from '@/lib/database';

export async function GET() {
  const startTime = Date.now();
  const health: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    services: {
      database: {
        status: 'up' | 'down';
        responseTime?: number;
        error?: string;
      };
    };
    version?: string;
  } = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: 'down',
      },
    },
  };

  // Check database connection
  try {
    const dbStartTime = Date.now();
    const isConnected = await checkDatabaseConnection();
    const dbResponseTime = Date.now() - dbStartTime;

    if (isConnected) {
      health.services.database.status = 'up';
      health.services.database.responseTime = dbResponseTime;

      // Try to get connection pool info
      try {
        const connection = await getConnection();
        // Test query
        await connection.execute('SELECT 1 FROM DUAL');
        await connection.close();
      } catch (err) {
        health.status = 'degraded';
        health.services.database.error = 'Connection pool issue';
      }
    } else {
      health.status = 'unhealthy';
      health.services.database.status = 'down';
      health.services.database.error = 'Database connection failed';
    }
  } catch (error) {
    health.status = 'unhealthy';
    health.services.database.status = 'down';
    health.services.database.error =
      error instanceof Error ? error.message : 'Unknown error';
  }

  // Add version info if available
  if (process.env.npm_package_version) {
    health.version = process.env.npm_package_version;
  }

  const responseTime = Date.now() - startTime;

  const statusCode =
    health.status === 'healthy'
      ? 200
      : health.status === 'degraded'
        ? 200
        : 503;

  return NextResponse.json(
    {
      ...health,
      responseTime,
    },
    { status: statusCode }
  );
}

