import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAdmin, unauthorized } from '@/lib/auth';

// GET all categories (admin view)
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  try {
    const result = await pool.query(
      'SELECT id, name, emoji, is_active, sort_order, created_at FROM categories ORDER BY sort_order, name'
    );
    return NextResponse.json({ categories: result.rows });
  } catch (err) {
    console.error('GET categories error:', err);
    return NextResponse.json({ error: 'Failed to load categories' }, { status: 500 });
  }
}

// POST create category
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  try {
    const { name, emoji, sort_order } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const result = await pool.query(
      'INSERT INTO categories (name, emoji, sort_order) VALUES ($1, $2, $3) RETURNING *',
      [name.trim(), emoji || '📌', sort_order || 0]
    );
    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Category already exists' }, { status: 409 });
    }
    console.error('POST category error:', err);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}
