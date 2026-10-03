import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'morrow_admin_panel_secret_2024';

export function signToken(email: string) {
  return jwt.sign({ email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdmin(req: NextRequest): { email: string } | null {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;

  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET) as { email: string; role: string };
    if (decoded.role !== 'admin') return null;
    return { email: decoded.email };
  } catch {
    return null;
  }
}

export function unauthorized() {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
