import { RegisterUserDto } from '@/lib/types';
import { registerSchema } from '@/lib/validationSchemas';
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { setCookie } from '@/lib/generateToken';
import { getConnection } from "@/lib/database";
import oracledb from 'oracledb';

/**
 *  @method  POST
 *  @route   ~/api/auth/register
 *  @desc    Create New User [(Register) (Sign Up) (انشاء حساب)]
 *  @access  public
 */
export async function POST(request: NextRequest) {
  let connection;
  try {
    const body = await request.json() as RegisterUserDto;
    
    // ✅ Validate
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    connection = await getConnection();

    // ✅ Check if user exists
    const emailCheck = await connection.execute(
      `SELECT ID FROM TAH57.USERS WHERE EMAIL = :email`,
      { email: body.email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (emailCheck.rows && emailCheck.rows.length > 0) {
      return NextResponse.json(
        { message: 'This user already registered' },
        { status: 400 }
      );
    }

    // ✅ Get default role (PATIENT) for new users
    const roleResult = await connection.execute(
      `SELECT ROLES_ID AS ID FROM TAH57.ROLES WHERE NAME = 'PATIENT' AND IS_ACTIVE = 1`,
      {},
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

// 👇 استخدام النوع
     type RoleRow = { ID: number };

     const defaultRoleId = (roleResult.rows?.[0] as RoleRow)?.ID || null;

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // ✅ Insert user with default role
    const result = await connection.execute(
      `INSERT INTO TAH57.USERS (USERNAME, EMAIL, PASSWORD, IS_ADMIN, ROLE_ID)
       VALUES (:username, :email, :password, 0, :roleId)
       RETURNING ID, USERNAME, IS_ADMIN, ROLE_ID INTO :id, :usernameOut, :isAdminOut, :roleIdOut`,
      {
        username: body.username,
        email: body.email,
        password: hashedPassword,
        roleId: defaultRoleId,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        usernameOut: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 100 },
        isAdminOut: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        roleIdOut: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    await connection.commit();

    const newUser = {
      id: (result.outBinds as any).id[0],
      username: (result.outBinds as any).usernameOut[0],
      isAdmin: (result.outBinds as any).isAdminOut[0] === 1,
      roleId: (result.outBinds as any).roleIdOut[0]
    };

    // ✅ Get user permissions (for PATIENT role)
    const permissionsResult = await connection.execute(
      `SELECT DISTINCT p.NAME
       FROM TAH57.ROLES r
       JOIN TAH57.ROLE_PERMISSIONS rp ON r.ROLES_ID = rp.ROLE_ID
       JOIN TAH57.PERMISSIONS p ON rp.ROLE_PERMISSIONS_ID = p.PERMISSIONS_ID
       WHERE r.ID = :roleId AND r.IS_ACTIVE = 1 AND p.IS_ACTIVE = 1`,
      { roleId: newUser.roleId },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const permissions = permissionsResult.rows?.map((row: any) => row.NAME) || [];

    // ✅ Create JWT payload with role and permissions
    const jwtPayload = {
      id: newUser.id,
      username: newUser.username,
      isAdmin: newUser.isAdmin,
      roleId: newUser.roleId,
      roleName: 'PATIENT', // default role for new users
      permissions: permissions
    };

    const cookie = setCookie(jwtPayload);

    // ✅ Return user info
    const userResponse = {
      id: newUser.id,
      username: newUser.username,
      email: body.email,
      isAdmin: newUser.isAdmin,
      roleId: newUser.roleId,
      roleName: 'PATIENT',
      permissions: permissions
    };

    return NextResponse.json(
      { 
        ...userResponse, 
        message: "Registered & Authenticated" 
      },
      {
        status: 201,
        headers: { "Set-Cookie": cookie }
      }
    );

  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return NextResponse.json(
      { message: 'internal server error' },
      { status: 500 }
    );
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error("DB Close ERROR:", err);
      }
    }
  }
}