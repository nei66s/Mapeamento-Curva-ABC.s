import { NextRequest, NextResponse } from 'next/server';
import { getUsers } from '@/lib/users.server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const users = await getUsers();
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    // Remove a senha antes de retornar
    const { password: _, ...userWithoutPassword } = user;

    const res = NextResponse.json({
      user: userWithoutPassword,
      message: 'Login bem-sucedido'
    });
    // Set a server-readable cookie with the user id so server layouts can load preferences
    try {
      res.cookies.set('userId', String(user.id), {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    } catch (e) {
      // ignore cookie set errors
    }
    return res;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
