import { LoginUserDto } from '@/lib/types';
import { loginSchema } from '@/lib/validationSchemas';
import { NextResponse, NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { setCookie } from '@/lib/generateToken';
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


// Check for special admin login via .env

           if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            console.log("Admin login successful");

            const cookie = setCookie({
               id: 0, // admin static ID
               isAdmin: true,
               username: 'Super Admin',
               });

              return NextResponse.json(
                 { message: 'Authenticated as admin' },
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

    // ✅ Fetch user by email
    const result = await connection.execute(
      `SELECT ID, USERNAME, EMAIL, PASSWORD, IS_ADMIN 
       FROM USERS 
       WHERE EMAIL = :email`,
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

    // ✅ Generate Cookie (JWT)
    const cookie = setCookie({
      id: user.ID,
      isAdmin: user.IS_ADMIN === 1,
      username: user.USERNAME,
    });

    return NextResponse.json(
      { message: 'Authenticated' },
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