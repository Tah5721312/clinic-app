import { NextRequest, NextResponse } from "next/server";
import oracledb from "oracledb";
import bcrypt from "bcryptjs";
import { getConnection } from "@/lib/database";

export async function POST(req: NextRequest) {
  let connection;

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password required" }, { status: 400 });
    }

    // ✅ Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    connection = await getConnection();

    // ✅ Check if user exists
    const result = await connection.execute(
      `SELECT ID FROM USERS WHERE EMAIL = :email`,
      { email },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const user = result.rows?.[0];
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    // ✅ Update password
    await connection.execute(
      `UPDATE USERS SET PASSWORD = :password WHERE EMAIL = :email`,
      { password: hashedPassword, email },
      { autoCommit: true }
    );

    return NextResponse.json({ message: "Password updated successfully" });

  } catch (error) {
    console.error("Reset Password Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}
