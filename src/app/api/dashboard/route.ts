import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorized();

  try {
    const [usersRes, habitsRes, completionsRes, activeRes, recentRes, dailyRes, categoryRes] =
      await Promise.all([
        pool.query('SELECT COUNT(*) FROM users'),
        pool.query('SELECT COUNT(*) FROM habits'),
        pool.query('SELECT COUNT(*) FROM habit_completions'),
        pool.query(
          `SELECT COUNT(DISTINCT h.user_id)
           FROM habit_completions hc
           JOIN habits h ON h.id = hc.habit_id
           WHERE hc.completed_date = CURRENT_DATE`
        ),
        pool.query(
          `SELECT u.id, u.name, u.email, u.created_at,
                  COUNT(h.id) as habit_count
           FROM users u
           LEFT JOIN habits h ON h.user_id = u.id
           GROUP BY u.id
           ORDER BY u.created_at DESC
           LIMIT 10`
        ),
        pool.query(
          `SELECT completed_date as day, COUNT(*) as count
           FROM habit_completions
           WHERE completed_date >= CURRENT_DATE - INTERVAL '6 days'
           GROUP BY completed_date
           ORDER BY completed_date`
        ),
        pool.query(
          `SELECT category, COUNT(*) as count
           FROM habits
           GROUP BY category
           ORDER BY count DESC`
        ),
      ]);

    return Response.json({
      totalUsers: parseInt(usersRes.rows[0].count),
      totalHabits: parseInt(habitsRes.rows[0].count),
      totalCompletions: parseInt(completionsRes.rows[0].count),
      activeUsersToday: parseInt(activeRes.rows[0].count),
      recentUsers: recentRes.rows.map((r: any) => ({
        ...r,
        habit_count: parseInt(r.habit_count),
      })),
      completionsByDay: dailyRes.rows.map((r: any) => ({
        day: new Date(r.day).toLocaleDateString('en-US', { weekday: 'short' }),
        count: parseInt(r.count),
      })),
      habitsByCategory: categoryRes.rows.map((r: any) => ({
        category: r.category || 'Other',
        count: parseInt(r.count),
      })),
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
