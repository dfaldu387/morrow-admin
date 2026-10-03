import { NextRequest } from 'next/server';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorized();

  return Response.json({ user: { email: admin.email, name: 'Admin' } });
}
