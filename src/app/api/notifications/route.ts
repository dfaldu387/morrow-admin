import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyAdmin, unauthorized } from '@/lib/auth';

// GET — notification history (grouped by title+body+type+created_at batch)
export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM (
         SELECT DISTINCT title, body, type, date_trunc('second', created_at) as batch_time
         FROM notifications
         GROUP BY title, body, type, date_trunc('second', created_at)
       ) sub`
    );
    const total = parseInt(countRes.rows[0].count);

    const historyRes = await pool.query(
      `SELECT
         title, body, type,
         date_trunc('second', created_at) as sent_at,
         COUNT(*) as recipient_count,
         COUNT(CASE WHEN read = true THEN 1 END) as read_count,
         COUNT(CASE WHEN read = false THEN 1 END) as unread_count
       FROM notifications
       GROUP BY title, body, type, date_trunc('second', created_at)
       ORDER BY sent_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return Response.json({
      notifications: historyRes.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
