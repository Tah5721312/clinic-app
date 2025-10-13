import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);

    const query = `
      SELECT 
        u.USER_ID,
        u.USERNAME,
        u.EMAIL,
        COALESCE(u.FULL_NAME, u.USERNAME) as FULL_NAME,
        r.ROLE_ID,
        r.NAME as ROLE_NAME,
        LISTAGG(
          CASE 
            WHEN rp.SUBJECT IS NOT NULL THEN 
              rp.SUBJECT || '|' || rp.ACTION || '|' || COALESCE(rp.FIELD_NAME, '') || '|' || rp.CAN_ACCESS
            ELSE NULL
          END, ';'
        ) WITHIN GROUP (ORDER BY rp.SUBJECT, rp.ACTION) as PERMISSIONS_STRING
      FROM TAH57.USERS u
      LEFT JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLE_ID
      LEFT JOIN TAH57.ROLE_PERMISSIONS rp ON r.ROLE_ID = rp.ROLE_ID
      WHERE u.USER_ID = :userId
      GROUP BY u.USER_ID, u.USERNAME, u.EMAIL, u.FULL_NAME, r.ROLE_ID, r.NAME
    `;

    const result = await executeQuery<{
      USER_ID: number;
      USERNAME: string;
      EMAIL: string;
      FULL_NAME: string;
      ROLE_ID: number;
      ROLE_NAME: string;
      PERMISSIONS_STRING: string;
    }>(query, { userId });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const permissions: { SUBJECT: string; ACTION: string; FIELD_NAME: string | null; CAN_ACCESS: number }[] = [];
    
    if (row.PERMISSIONS_STRING) {
      const permissionStrings = row.PERMISSIONS_STRING.split(';');
      permissionStrings.forEach(permStr => {
        if (permStr.trim()) {
          const [subject, action, fieldName, canAccess] = permStr.split('|');
          permissions.push({
            SUBJECT: subject,
            ACTION: action,
            FIELD_NAME: fieldName || null,
            CAN_ACCESS: parseInt(canAccess) || 0
          });
        }
      });
    }

    const user = {
      USER_ID: row.USER_ID,
      USERNAME: row.USERNAME,
      FULL_NAME: row.FULL_NAME,
      EMAIL: row.EMAIL,
      ROLE_ID: row.ROLE_ID,
      ROLE_NAME: row.ROLE_NAME,
      PERMISSIONS: permissions
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}


// ***************

// update user roles

// ***************

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = parseInt(params.id);
    const body = await request.json();
    const { username, email, fullName, roleId, newUserId } = body;

    // If the client requests changing the USER_ID, validate uniqueness first
    let effectiveUserId = userId;
    if (typeof newUserId === 'number' && newUserId !== userId) {
      const existsQuery = `
        SELECT COUNT(*) as count
        FROM TAH57.USERS
        WHERE USER_ID = :newUserId
      `;
      const existsResult = await executeQuery<{ count: number }>(existsQuery, { newUserId });
      if (existsResult.rows[0].count > 0) {
        return NextResponse.json(
          { error: 'USER_ID already exists' },
          { status: 409 }
        );
      }

      // Update the primary key first
      const updateIdQuery = `
        UPDATE TAH57.USERS
        SET USER_ID = :newUserId
        WHERE USER_ID = :userId
      `;
      await executeQuery(updateIdQuery, { newUserId, userId });
      effectiveUserId = newUserId;
    }

    const updateQuery = `
      UPDATE TAH57.USERS 
      SET USERNAME = :username,
          EMAIL = :email,
          FULL_NAME = :fullName,
          ROLE_ID = :roleId
      WHERE USER_ID = :effectiveUserId
    `;

    await executeQuery(updateQuery, {
      username,
      email,
      fullName,
      roleId,
      effectiveUserId
    });

// when update user from nurse to super admin  
//   i refresh page to refresh الصلاحيات shown in page
// الحل 
    // Fetch updated user data with permissions
    const fetchQuery = `
      SELECT 
        u.USER_ID,
        u.USERNAME,
        u.EMAIL,
        COALESCE(u.FULL_NAME, u.USERNAME) as FULL_NAME,
        r.ROLE_ID,
        r.NAME as ROLE_NAME,
        LISTAGG(
          CASE 
            WHEN rp.SUBJECT IS NOT NULL THEN 
              rp.SUBJECT || '|' || rp.ACTION || '|' || COALESCE(rp.FIELD_NAME, '') || '|' || rp.CAN_ACCESS
            ELSE NULL
          END, ';'
        ) WITHIN GROUP (ORDER BY rp.SUBJECT, rp.ACTION) as PERMISSIONS_STRING
      FROM TAH57.USERS u
      LEFT JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLE_ID
      LEFT JOIN TAH57.ROLE_PERMISSIONS rp ON r.ROLE_ID = rp.ROLE_ID
      WHERE u.USER_ID = :effectiveUserId
      GROUP BY u.USER_ID, u.USERNAME, u.EMAIL, u.FULL_NAME, r.ROLE_ID, r.NAME
    `;

    const result = await executeQuery<{
      USER_ID: number;
      USERNAME: string;
      EMAIL: string;
      FULL_NAME: string;
      ROLE_ID: number;
      ROLE_NAME: string;
      PERMISSIONS_STRING: string;
    }>(fetchQuery, { effectiveUserId });

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found after update' },
        { status: 404 }
      );
    }

    const row = result.rows[0];
    const permissions: { SUBJECT: string; ACTION: string; FIELD_NAME: string | null; CAN_ACCESS: number }[] = [];
    
    if (row.PERMISSIONS_STRING) {
      const permissionStrings = row.PERMISSIONS_STRING.split(';');
      permissionStrings.forEach(permStr => {
        if (permStr.trim()) {
          const [subject, action, fieldName, canAccess] = permStr.split('|');
          permissions.push({
            SUBJECT: subject,
            ACTION: action,
            FIELD_NAME: fieldName || null,
            CAN_ACCESS: parseInt(canAccess) || 0
          });
        }
      });
    }

    const updatedUser = {
      USER_ID: row.USER_ID,
      USERNAME: row.USERNAME,
      FULL_NAME: row.FULL_NAME,
      EMAIL: row.EMAIL,
      ROLE_ID: row.ROLE_ID,
      ROLE_NAME: row.ROLE_NAME,
      PERMISSIONS: permissions
    };

    return NextResponse.json({ 
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}


// ***************

// DELETE user roles

// ***************
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {

    if (!params?.id || isNaN(Number(params.id))) {
      return NextResponse.json({ error: 'Missing user ID' }, { status: 400 });
    }
    
    const userId = parseInt(params.id);

    const query = `DELETE FROM TAH57.USERS WHERE USER_ID = :userId`;

    await executeQuery(query, { userId });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
