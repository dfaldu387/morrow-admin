import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorized();

  try {
    const [totalRes, readRes, typeRes, recentRes] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM notifications'),
      pool.query(
        `SELECT
           COUNT(*) as total,
           COUNT(CASE WHEN read = true THEN 1 END) as read_count,
           COUNT(CASE WHEN read = false THEN 1 END) as unread_count
         FROM notifications`
      ),
      pool.query(
        `SELECT type, COUNT(*) as count
         FROM notifications
         GROUP BY type
         ORDER BY count DESC`
      ),
      pool.query(
        `SELECT
           date_trunc('day', created_at) as day,
           COUNT(*) as count
         FROM notifications
         WHERE created_at >= NOW() - INTERVAL '7 days'
         GROUP BY day
         ORDER BY day`
      ),
    ]);

    const stats = readRes.rows[0];

    return Response.json({
      totalSent: parseInt(totalRes.rows[0].count),
      readCount: parseInt(stats.read_count),
      unreadCount: parseInt(stats.unread_count),
      readRate: parseInt(stats.total) > 0
        ? Math.round((parseInt(stats.read_count) / parseInt(stats.total)) * 100)
        : 0,
      byType: typeRes.rows.map((r: any) => ({
        type: r.type,
        count: parseInt(r.count),
      })),
      last7Days: recentRes.rows.map((r: any) => ({
        day: new Date(r.day).toLocaleDateString('en-US', { weekday: 'short' }),
        count: parseInt(r.count),
      })),
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
