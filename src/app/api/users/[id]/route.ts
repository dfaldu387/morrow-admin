import { NextRequest } from 'next/server';
import pool from '@/lib/db';
import { verifyAdmin, unauthorized } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorized();

  try {
    const { id } = params;

    const userRes = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [id]
    );

    if (userRes.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const habitsRes = await pool.query(
      `SELECT h.id, h.name, h.emoji, h.color, h.category, h.archived,
              COUNT(hc.id) as total_completions
       FROM habits h
       LEFT JOIN habit_completions hc ON hc.habit_id = h.id
       WHERE h.user_id = $1
       GROUP BY h.id
       ORDER BY h.created_at DESC`,
      [id]
    );

    const habits = await Promise.all(
      habitsRes.rows.map(async (habit: any) => {
        const streakRes = await pool.query(
          'SELECT completed_date FROM habit_completions WHERE habit_id = $1 ORDER BY completed_date DESC',
          [habit.id]
        );

        let streak = 0;
        if (streakRes.rows.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          let checkDate = new Date(today);

          for (const row of streakRes.rows) {
            const d = new Date(row.completed_date);
            d.setHours(0, 0, 0, 0);

            if (d.getTime() === checkDate.getTime()) {
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else if (streak === 0 && d.getTime() === checkDate.getTime() - 86400000) {
              checkDate = new Date(d);
              streak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }

        return {
          ...habit,
          total_completions: parseInt(habit.total_completions),
          streak,
        };
      })
    );

    const totalCompletions = habits.reduce((sum: number, h: any) => sum + h.total_completions, 0);

    return Response.json({
      ...userRes.rows[0],
      habits,
      stats: {
        totalHabits: habits.length,
        totalCompletions,
        activeHabits: habits.filter((h: any) => !h.archived).length,
        archivedHabits: habits.filter((h: any) => h.archived).length,
      },
    });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = verifyAdmin(req);
  if (!admin) return unauthorized();

  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [params.id]);

    if (result.rows.length === 0) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    return Response.json({ message: 'User deleted successfully' });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
