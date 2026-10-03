import { NextRequest } from 'next/server';
import bcrypt from 'bcrypt';
import { signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    return Response.json({ error: 'Email and password are required' }, { status: 400 });
  }

  if (email.toLowerCase() !== adminEmail?.toLowerCase() || password !== adminPassword) {
    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = signToken(email);
  return Response.json({ token, user: { email: adminEmail, name: 'Admin' } });
}
