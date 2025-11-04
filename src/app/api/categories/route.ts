import { NextResponse } from 'next/server';
import {
  listCategories,
  getCategoryById,
  createCategory,
  createCategoriesBulk,
  updateCategory,
  deleteCategory,
} from '@/lib/categories.server';
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (id) {
      const category = await getCategoryById(String(id));
      if (!category) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      return NextResponse.json(category);
    }
    const categories = await listCategories();
    return NextResponse.json(categories);
  } catch (err) {
    console.error('GET /api/categories error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ 
      error: 'Failed to load categories', 
      details: errorMessage 
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (Array.isArray(body)) {
      const created = await createCategoriesBulk(body);
      return NextResponse.json(created, { status: 201 });
    }
    const created = await createCategory(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('POST /api/categories error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create category', details: errorMessage }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const id = body?.id;
    if (!id) return NextResponse.json({ error: 'Missing id in body' }, { status: 400 });
    const updated = await updateCategory(String(id), body);
    if (!updated) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/categories error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update category', details: errorMessage }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    let id = url.searchParams.get('id');
    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch (_) {
        // ignore
      }
    }
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const ok = await deleteCategory(String(id));
    return NextResponse.json({ deleted: ok });
  } catch (err) {
    console.error('DELETE /api/categories error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to delete category', details: errorMessage }, { status: 500 });
  }
}
