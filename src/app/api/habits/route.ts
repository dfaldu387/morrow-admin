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
      whereClause = 'WHERE h.name ILIKE $1 OR h.category ILIKE $1';
      values.push(`%${search}%`);
    }

    const countRes = await pool.query(`SELECT COUNT(*) FROM habits h ${whereClause}`, values);
    const total = parseInt(countRes.rows[0].count);

    const habitsQuery = `
      SELECT h.id, h.name, h.emoji, h.color, h.category, h.archived, h.created_at,
             u.name as user_name, u.email as user_email,
             COUNT(hc.id) as total_completions
      FROM habits h
      JOIN users u ON u.id = h.user_id
      LEFT JOIN habit_completions hc ON hc.habit_id = h.id
      ${whereClause}
      GROUP BY h.id, u.name, u.email
      ORDER BY h.created_at DESC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;

    const habitsRes = await pool.query(habitsQuery, [...values, limit, offset]);

    return Response.json({
      habits: habitsRes.rows.map((r: any) => ({
        ...r,
        total_completions: parseInt(r.total_completions),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
