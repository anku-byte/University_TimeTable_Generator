import { NextResponse } from 'next/server';
import { authenticateUser, signSessionToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const session = await authenticateUser(email.trim(), password);

    if (!session) {
      return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
    }

    const token = signSessionToken(session);

    const response = NextResponse.json({
      success: true,
      user: session,
      redirectTo: session.role === 'ADMIN' ? '/admin' : '/viewer',
    });

    response.cookies.set({
      name: 'cg_session',
      value: token,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'Authentication failed' }, { status: 500 });
  }
}

