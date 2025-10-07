import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

type RoleRow = {
  ROLE_ID: number;
  NAME: string;
  DESCRIPTION?: string | null;
  IS_ACTIVE?: number | null;
  CREATED_AT?: Date | string | null;
  UPDATED_AT?: Date | string | null;
};

export async function GET() {
  try {
    const sql = `
      SELECT ROLE_ID, NAME, DESCRIPTION, IS_ACTIVE, CREATED_AT, UPDATED_AT
      FROM tah57.ROLES
      ORDER BY ROLE_ID
    `;

    const { rows } = await executeQuery<RoleRow>(sql);

    return NextResponse.json({
      status: 'success',
      data: rows,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to fetch roles',
      },
      { status: 500 }
    );
  }
}


