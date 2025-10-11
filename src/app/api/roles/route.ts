import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET() {
  try {
    const query = `
      SELECT 
        ROLE_ID,
        NAME,
        DESCRIPTION,
        IS_ACTIVE
      FROM TAH57.ROLES
      WHERE IS_ACTIVE = 1
      ORDER BY NAME
    `;

    const result = await executeQuery<{
      ROLE_ID: number;
      NAME: string;
      DESCRIPTION: string | null;
      IS_ACTIVE: number;
    }>(query);

    return NextResponse.json({ roles: result.rows });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}
