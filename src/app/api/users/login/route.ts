import { LoginUserDto } from '@/lib/types';
import { loginSchema } from '@/lib/validationSchemas';
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { setCookie, generateJWTWithRole } from '@/lib/generateToken';
import { getConnection } from '@/lib/database';
import oracledb from "oracledb";

export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json() as LoginUserDto;
    
    // ✅ validate input with Zod
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }
    
    const { email, password } = body;

    // ✅ Check for special admin login via .env
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      console.log("Super Admin login successful");
      
      const jwtPayload = {
        id: 0, // admin static ID
        isAdmin: true,
        username: 'Super Admin',
        roleId: undefined,
        roleName: 'SUPER_ADMIN',
        permissions: [] // Super admin has all permissions by default
      };
      
      const cookie = setCookie(jwtPayload);
      
      return NextResponse.json(
        { 
          message: 'Authenticated as Super Admin',
          user: {
            id: 0,
            username: 'Super Admin',
            email: email,
            isAdmin: true,
            roleName: 'SUPER_ADMIN'
          }
        },
        {
          status: 200,
          headers: { "Set-Cookie": cookie },
        }
      );
    } else if (email === process.env.ADMIN_EMAIL) {
      console.log("Admin password mismatch");
    }

    // ✅ Connect to DB for regular users
    try {
      connection = await getConnection();
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { message: 'Database connection failed' },
        { status: 500 }
      );
    }

    // ✅ Fetch user by email with role information
    const result = await connection.execute(
      `SELECT u.ID, u.USERNAME, u.EMAIL, u.PASSWORD, u.IS_ADMIN, u.ROLE_ID, r.NAME as ROLE_NAME
       FROM TAH57.USERS u
       LEFT JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLES_ID
       WHERE u.EMAIL = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const user = result.rows?.[0] as any;
    
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 400 });
    }

    // ✅ Check password
    const isPasswordMatch = await bcrypt.compare(password, user.PASSWORD);
    if (!isPasswordMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 400 });
    }

    // ✅ Get user permissions
    const permissionsResult = await connection.execute(
      `SELECT DISTINCT p.NAME
       FROM TAH57.USERS u
       JOIN TAH57.ROLES r ON u.ROLE_ID = r.ROLES_ID
       JOIN TAH57.ROLE_PERMISSIONS rp ON r.ID = rp.ROLE_ID
       JOIN TAH57.PERMISSIONS p ON rp.ROLE_PERMISSIONS_ID = p.PERMISSIONS_ID
       WHERE u.ID = :userId AND r.IS_ACTIVE = 1 AND p.IS_ACTIVE = 1`,
      { userId: user.ID },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const permissions = permissionsResult.rows?.map((row: any) => row.NAME) || [];

    // ✅ Generate JWT payload with role and permissions
    const jwtPayload = {
      id: user.ID,
      isAdmin: user.IS_ADMIN === 1,
      username: user.USERNAME,
      roleId: user.ROLE_ID,
      roleName: user.ROLE_NAME || 'USER',
      permissions: permissions
    };

    const cookie = setCookie(jwtPayload);

    // ✅ Return user info (without password)
    const userResponse = {
      id: user.ID,
      username: user.USERNAME,
      email: user.EMAIL,
      isAdmin: user.IS_ADMIN === 1,
      roleId: user.ROLE_ID,
      roleName: user.ROLE_NAME || 'USER',
      permissions: permissions
    };

    return NextResponse.json(
      { 
        message: 'Authenticated',
        user: userResponse
      },
      {
        status: 200,
        headers: { "Set-Cookie": cookie },
      }
    );

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error("DB Close Error:", closeErr);
      }
    }
  }
}