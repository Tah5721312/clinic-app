import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import bcrypt from 'bcryptjs';

// Interface for user with role and permissions
interface UserWithRolePermissions {
  USER_ID: number;
  USERNAME: string;
  FULL_NAME: string;
  EMAIL: string;
  ROLE_ID: number;
  ROLE_NAME: string;
  PERMISSIONS: {
    SUBJECT: string;
    ACTION: string;
    FIELD_NAME: string | null;
    CAN_ACCESS: number;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const usernameFilter = searchParams.get('username') || '';
    const roleFilter = searchParams.get('role') || '';

    // Build the query to get users with their roles and permissions
    let query = `
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
    `;

    const conditions = [];
    const params: any = {};

    if (usernameFilter) {
      conditions.push('UPPER(u.USERNAME) LIKE UPPER(:usernameFilter)');
      params.usernameFilter = `%${usernameFilter}%`;
    }

    if (roleFilter) {
      conditions.push('r.NAME = :roleFilter');
      params.roleFilter = roleFilter;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY u.USER_ID, u.USERNAME, u.EMAIL, u.FULL_NAME, r.ROLE_ID, r.NAME
      ORDER BY USER_ID
    `;

    const result = await executeQuery<{
      USER_ID: number;
      USERNAME: string;
      EMAIL: string;
      FULL_NAME: string;
      ROLE_ID: number;
      ROLE_NAME: string;
      PERMISSIONS_STRING: string;
    }>(query, params);

    // Transform the result to include permissions as an array
    const users: UserWithRolePermissions[] = result.rows.map(row => {
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

      return {
        USER_ID: row.USER_ID,
        USERNAME: row.USERNAME,
        FULL_NAME: row.FULL_NAME,
        EMAIL: row.EMAIL,
        ROLE_ID: row.ROLE_ID,
        ROLE_NAME: row.ROLE_NAME,
        PERMISSIONS: permissions
      };
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}





export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, fullName, password, roleId } = body;

    // Validate required fields
    if (!username || !email || !fullName || !password || !roleId) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Check if username already exists
    const checkUserQuery = `
      SELECT COUNT(*) as count FROM TAH57.USERS WHERE USERNAME = :username
    `;
    const checkResult = await executeQuery<{ count: number }>(checkUserQuery, { username });
    
    if (checkResult.rows[0].count > 0) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 409 }
      );
    }

    // Check if email already exists
    const checkEmailQuery = `
      SELECT COUNT(*) as count FROM TAH57.USERS WHERE EMAIL = :email
    `;
    const checkEmailResult = await executeQuery<{ count: number }>(checkEmailQuery, { email });
    
    if (checkEmailResult.rows[0].count > 0) {
      return NextResponse.json(
        { error: 'Email already exists' },
        { status: 409 }
      );
    }

    // Hash password using bcrypt
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const insertQuery = `
      INSERT INTO TAH57.USERS (USERNAME, EMAIL, FULL_NAME, PASSWORD, ROLE_ID, IS_ACTIVE)
      VALUES (:username, :email, :fullName, :password, :roleId, 1)
    `;

    await executeQuery(insertQuery, {
      username,
      email,
      fullName,
      password: hashedPassword,
      roleId
    });

    return NextResponse.json({ 
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
