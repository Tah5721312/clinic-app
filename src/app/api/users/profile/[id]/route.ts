import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/verifyToken";
import { UpdateUserDto, UserFromDB } from "@/lib/types";
import { updateUserSchema } from "@/lib/validationSchemas";
import bcrypt from "bcryptjs";
import { getConnection } from "@/lib/database";
import oracledb from "oracledb";

/**
 *  @method  DELETE
 *  @route   ~/api/users/profile/:id
 *  @desc    Delete Profile
 *  @access  private (only user himself can delete his account)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  try {
    connection = await getConnection();
    const { id } = await params;

    // ✅ تحقق هل المستخدم موجود
    const result = await connection.execute<UserFromDB>(
      `SELECT ID, USERNAME, EMAIL FROM USERS WHERE ID = :id`,
      { id: Number(id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const user = result.rows?.[0];

    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    // ✅ تحقق من الـ Token
    const userFromToken = verifyToken(request);
    if (userFromToken && userFromToken.id === user.ID) {
      const deleteRes = await connection.execute(
        `DELETE FROM USERS WHERE ID = :id`,
        { id: Number(id) },
        { autoCommit: true }
      );
      if (deleteRes.rowsAffected && deleteRes.rowsAffected > 0) {
        return NextResponse.json({ message: "your profile has been deleted" }, { status: 200 });
      }
    }

    return NextResponse.json(
      { message: "only user himself can delete his profile" },
      { status: 403 }
    );
  } catch (error) {
    console.error("DELETE PROFILE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}

/**
 *  @method  GET
 *  @route   ~/api/users/profile/:id
 *  @desc    Get Profile By Id
 *  @access  private
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  try {
    connection = await getConnection();
    const { id } = await params;
    const result = await connection.execute<UserFromDB>(
      `SELECT ID, USERNAME, EMAIL, IS_ADMIN, CREATED_AT FROM USERS WHERE ID = :id`,
      { id: Number(id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const user = result.rows?.[0];
    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    const userFromToken = verifyToken(request);
    if (!userFromToken || userFromToken.id !== user.ID) {
      return NextResponse.json({ message: "access denied" }, { status: 403 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}

/**
 *  @method  PUT
 *  @route   ~/api/users/profile/:id
 *  @desc    Update Profile
 *  @access  private
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  try {
    connection = await getConnection();
    const { id } = await params;

    // ✅ تحقق من وجود المستخدم
    const result = await connection.execute<UserFromDB>(
      `SELECT ID, USERNAME, EMAIL, PASSWORD FROM USERS WHERE ID = :id`,
      { id: Number(id) },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const user = result.rows?.[0];
    if (!user) {
      return NextResponse.json({ message: "user not found" }, { status: 404 });
    }

    // ✅ تحقق من التوكن
    const userFromToken = verifyToken(request);
    if (!userFromToken || userFromToken.id !== user.ID) {
      return NextResponse.json({ message: "access denied" }, { status: 403 });
    }

    // ✅ تحقق من البيانات
    const body = (await request.json()) as UpdateUserDto;
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: validation.error.issues[0].message }, { status: 400 });
    }

    // ✅ تحديث البيانات
    let hashedPassword = user.PASSWORD;
    if (body.password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(body.password, salt);
    }

    const updateRes = await connection.execute(
      `UPDATE USERS 
       SET USERNAME = :username, EMAIL = :email, PASSWORD = :password 
       WHERE ID = :id`,
      {
        username: body.username || user.USERNAME,
        email: body.email || user.EMAIL,
        password: hashedPassword,
        id: Number(id),
      },
      { autoCommit: true }
    );

    if (updateRes.rowsAffected && updateRes.rowsAffected > 0) {
      return NextResponse.json(
        { id: user.ID, username: body.username || user.USERNAME, email: body.email || user.EMAIL },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ message: "update failed" }, { status: 400 });
    }
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return NextResponse.json({ message: "internal server error" }, { status: 500 });
  } finally {
    if (connection) await connection.close();
  }
}
