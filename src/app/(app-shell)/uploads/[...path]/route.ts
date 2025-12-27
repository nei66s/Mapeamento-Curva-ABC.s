import { readFile, access } from 'fs/promises';
import path from 'path';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  context: any
) {
  const { params } = context || {};
  try {
  const parts = params?.path || [];
    // Reconstruct the relative path inside public/uploads
    const relPath = parts.join(path.sep);
    const filePath = path.join(process.cwd(), 'public', 'uploads', relPath);

    // Ensure file exists and is readable
    await access(filePath);

    const buffer = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const contentType =
      ext === '.png'
        ? 'image/png'
        : ext === '.svg'
        ? 'image/svg+xml'
        : ext === '.webp'
        ? 'image/webp'
        : ext === '.gif'
        ? 'image/gif'
        : 'image/jpeg';

    return new NextResponse(buffer, {
      headers: { 'Content-Type': contentType },
    });
  } catch (err) {
    // File not found or other error — return a small SVG placeholder (200)
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9ca3af" font-family="Roboto, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif" font-size="20">No image</text>
</svg>`;

    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml' },
    });
  }
}
