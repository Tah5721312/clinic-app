import { NextRequest, NextResponse } from 'next/server';

/**
 *  @method  GET
 *  @route   ~/api/users/logout
 *  @desc    Logout User
 *  @access  public
 */
export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully' }, 
      { status: 200 }
    );

    // Clear jwtToken cookie
    response.cookies.set({
      name: "jwtToken",
      value: "",
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production", // HTTPS بس في production
      sameSite: "strict",
      maxAge: 0, // يمسحه فورًا
    });

    return response;
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
