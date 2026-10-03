import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorized();

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const values: any[] = [];

    if (search) {
      whereClause = 'WHERE u.name ILIKE $1 OR u.email ILIKE $1';
      values.push(`%${search}%`);
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM users u ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].count);

    const usersQuery = `
      SELECT u.id, u.name, u.email, u.created_at,
             COUNT(DISTINCT h.id) as habit_count,
             COUNT(DISTINCT hc.id) as completion_count
      FROM users u
      LEFT JOIN habits h ON h.user_id = u.id
      LEFT JOIN habit_completions hc ON hc.habit_id = h.id
      ${whereClause}
      GROUP BY u.id
      ORDER BY u.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const usersRes = await pool.query(usersQuery, [...values, limit, offset]);

    return Response.json({
      users: usersRes.rows.map((r: any) => ({
        ...r,
        habit_count: parseInt(r.habit_count),
        completion_count: parseInt(r.completion_count),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
