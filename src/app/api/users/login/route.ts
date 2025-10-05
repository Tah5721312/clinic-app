import { LoginUserDto } from '@/lib/types';
import { loginSchema } from '@/lib/validationSchemas';
import { NextResponse, NextRequest } from 'next/server';
import { signIn } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginUserDto;

    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await signIn('credentials', {
      redirect: false,
      email: body.email,
      password: body.password,
    });

    if ((result as any)?.error) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 400 });
    }

    return NextResponse.json({ message: 'Authenticated' }, { status: 200 });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}