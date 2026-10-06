import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAdmin, unauthorized } from '@/lib/auth';

// PUT update category
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  try {
    const { id } = params;
    const { name, emoji, is_active, sort_order } = await req.json();

    const result = await pool.query(
      `UPDATE categories SET
        name = COALESCE($1, name),
        emoji = COALESCE($2, emoji),
        is_active = COALESCE($3, is_active),
        sort_order = COALESCE($4, sort_order)
      WHERE id = $5 RETURNING *`,
      [name, emoji, is_active, sort_order, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(result.rows[0]);
  } catch (err: any) {
    if (err.code === '23505') {
      return NextResponse.json({ error: 'Category name already exists' }, { status: 409 });
    }
    console.error('PUT category error:', err);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE category
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await verifyAdmin(req);
  if (!admin) return unauthorized();

  try {
    const { id } = params;
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('DELETE category error:', err);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
