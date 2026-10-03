import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorized();

  try {
    const { title, body, type } = await req.json();

    if (!title || !body) {
      return Response.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const usersRes = await pool.query('SELECT id FROM users');
    const users = usersRes.rows;

    if (users.length === 0) {
      return Response.json({ message: 'No users to notify', count: 0 });
    }

    const insertValues = users
      .map((_: any, i: number) => `($${i * 4 + 1}, $${i * 4 + 2}, $${i * 4 + 3}, $${i * 4 + 4})`)
      .join(', ');

    const params = users.flatMap((u: any) => [u.id, title, body, type || 'info']);

    await pool.query(
      `INSERT INTO notifications (user_id, title, body, type) VALUES ${insertValues}`,
      params
    );

    return Response.json({ message: 'Broadcast sent', count: users.length });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
