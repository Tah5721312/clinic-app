import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import oracledb from 'oracledb';

type VwPermissionRow = {
  USER_ID: number;
  USERNAME: string;
  FULL_NAME?: string | null;
  ROLE_NAME: string;
  SUBJECT: string;
  ACTION: string;
  FIELD_NAME?: string | null;
  CAN_ACCESS?: number | null;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection: oracledb.Connection | undefined;
  try {
    const { id } = await params;
    connection = await getConnection();
    const result = await connection.execute<VwPermissionRow>(
      `SELECT USER_ID, USERNAME, FULL_NAME, ROLE_NAME, SUBJECT, ACTION, FIELD_NAME, CAN_ACCESS
       FROM tah57.VW_USER_PERMISSIONS
       WHERE USER_ID = :id`,
      { id: Number(id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const rows = result.rows || [];
    const roleName = rows[0]?.ROLE_NAME || null;
    return NextResponse.json({
      status: 'success',
      data: {
        roleName,
        permissions: rows,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to fetch user permissions' },
      { status: 500 }
    );
  } finally {
    if (connection) await connection.close();
  }
}


