import { RegisterUserDto } from '@/lib/types';
import { registerSchema } from '@/lib/validationSchemas';
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getConnection } from "@/lib/database";
import { signIn } from '@/auth';

import oracledb from 'oracledb';

/**
 *  @method  POST
 *  @route   ~/api/users/register
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
      `SELECT ID FROM USERS WHERE EMAIL = :email`,
      { email: body.email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (emailCheck.rows && emailCheck.rows.length > 0) {
      return NextResponse.json(
        { message: 'This user already registered' },
        { status: 400 }
      );
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // ✅ Insert user
    const result = await connection.execute(
      `INSERT INTO USERS (USERNAME, EMAIL, PASSWORD, IS_ADMIN)
       VALUES (:username, :email, :password, 0)
       RETURNING ID, USERNAME, IS_ADMIN INTO :id, :usernameOut, :isAdminOut`,
      {
        username: body.username,
        email: body.email,
        password: hashedPassword,
        id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER },
        usernameOut: { dir: oracledb.BIND_OUT, type: oracledb.STRING, maxSize: 100 },
        isAdminOut: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
      }
    );

    await connection.commit();

    const newUser = {
      id: (result.outBinds as any).id[0],
      username: (result.outBinds as any).usernameOut[0],
      isAdmin: (result.outBinds as any).isAdminOut[0] === 1
    };

    // ✅ Create session using NextAuth
    await signIn('credentials', { redirect: false, email: body.email, password: body.password });

    return NextResponse.json(
      { ...newUser, message: "Registered & Authenticated" },
      { status: 201 }
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
        console.error("DB CLOSE ERROR:", err);
      }
    }
  }
}
