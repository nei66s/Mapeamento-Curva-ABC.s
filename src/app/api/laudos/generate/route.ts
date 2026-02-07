export const runtime = 'nodejs';

import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Import heavy/server-only modules dynamically to avoid bundling them into client-side code
  try {
    const [{ default: PDFDocument }, { WritableStreamBuffer }] = await Promise.all([
      import('pdfkit'),
      import('stream-buffers'),
    ]);

    const body = await request.json();

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const stream = new WritableStreamBuffer({ initialSize: 1024 * 1024, incrementAmount: 1024 * 1024 });
    doc.pipe(stream as any);

    // content width inside margins (use when writing paragraphs)
    const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Helpers to render header/footer on each page
    const renderHeader = () => {
      doc.fontSize(14).fillColor('#111827').text('Laudo de Avaliação Técnica', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#6B7280').text(`Gerado em: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1);
      doc.strokeColor('#E5E7EB').moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
      doc.moveDown(1);
      // ensure subsequent text starts at left margin
      doc.x = doc.page.margins.left;
    };

    const renderFooter = (pageNumber: number) => {
      // place footer inside bottom margin area (stay 10pt above bottom margin)
      const footerY = doc.page.height - doc.page.margins.bottom - 10;
      doc.fontSize(9).fillColor('#6B7280');
      doc.text(
        `Página ${pageNumber}`,
        doc.page.margins.left,
        footerY,
        { align: 'center', width: contentWidth }
      );
    };

    // Track page numbers and ensure header/footer are added for each page.
    let pageNumber = 1;
    // Register handler early so pageAdded events are handled consistently
    doc.on('pageAdded', () => {
      pageNumber += 1;
      // render header/footer for the new page
      renderHeader();
      renderFooter(pageNumber);
    });

    // initial header/footer for first page
    renderHeader();
    renderFooter(pageNumber);

    // Ensure we start at left margin
    doc.x = doc.page.margins.left;

    // Add content from body as structured text
    doc.fontSize(12).fillColor('#111827').text('1. Dados do Item Avaliado', { underline: false, width: contentWidth });
    doc.moveDown(0.5);

    const pushLabelValue = (label: string, value?: any) => {
      // Print label and value on same line, but allow wrapping within contentWidth
      doc.fontSize(10).fillColor('#374151').font('Helvetica').text(`${label}: `, { continued: true, width: contentWidth });
      doc.font('Helvetica-Bold').fillColor('#111827').text(String(value ?? '-'), { continued: false, width: contentWidth });
    };

    pushLabelValue('Descrição', body['item-description']);
    pushLabelValue('Número de patrimônio', body['item-patrimony']);
    pushLabelValue('Quantidade', body['item-quantity']);
    pushLabelValue('Localização', body['item-location']);

    doc.moveDown(1);
    doc.font('Helvetica').moveDown(0.5);

    doc.fontSize(12).fillColor('#111827').text('2. Avaliação Técnica', { width: contentWidth });
    doc.moveDown(0.5);
    pushLabelValue('Estado do item', body['item-state']);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#374151').text('Diagnóstico técnico detalhado:', { width: contentWidth });
    doc.moveDown(0.25);
    // write diagnosis with explicit width to allow wrapping and avoid cutoff
    doc.font('Helvetica').fillColor('#111827').text(body['item-diagnosis'] ?? '-', { align: 'left', width: contentWidth });
    doc.moveDown(0.5);
  pushLabelValue('Reparo viável', body['repair-viable']);
    doc.moveDown(0.5);
    pushLabelValue('Recomendações', body['recommendations']);

    // start a new page for the Responsible section
    doc.addPage();
    // after addPage the pageAdded handler ran and rendered header/footer + incremented pageNumber
    // ensure x is at margin for content
    doc.x = doc.page.margins.left;
    doc.fontSize(12).fillColor('#111827').text('3. Responsável pela Avaliação', { width: contentWidth });
    doc.moveDown(0.5);
  pushLabelValue('Nome do técnico', body['tech-name']);
  pushLabelValue('Cargo/Função', body['tech-role']);

    // footer for the current page is handled by the pageAdded handler (or initial renderFooter above)

    // Helper: calculate available vertical space on current page (points)
    const availableHeight = () => doc.page.height - doc.y - doc.page.margins.bottom;

    // Ensure there's enough space for a block; if not, add a page
    const ensureSpace = (required: number) => {
      if (availableHeight() < required) {
        doc.addPage();
        // after addPage the pageAdded handler runs and places header/footer
        // reset x to left margin
        doc.x = doc.page.margins.left;
      }
    };

    // Helper: load image buffer from data URI or remote URL
    const loadImageBuffer = async (src: string) => {
      try {
        if (!src) return null;
        if (src.startsWith('data:')) {
          const parts = src.split(',');
          const b64 = parts[1] ?? '';
          return Buffer.from(b64, 'base64');
        }
        // remote URL - fetch it
        const res = await fetch(src);
        if (!res.ok) return null;
        const arrayBuf = await res.arrayBuffer();
        return Buffer.from(arrayBuf);
      } catch (e) {
        return null;
      }
    };

    // Section: Photos (larger and with pagination safety)
    const photos: string[] = Array.isArray(body.photos) ? body.photos : [];
    if (photos.length > 0) {
      // Reserve header/footer area and start a dedicated page for photos
      doc.addPage();
      doc.x = doc.page.margins.left;
      doc.fontSize(12).fillColor('#111827').text('4. Fotos do Local', { width: contentWidth });
      doc.moveDown(0.5);

      // Desired image box height (points) -- a bit larger for clearer photos
      const imgBoxHeight = 180;
      const imgGap = 10;

      for (let i = 0; i < photos.length; i++) {
        const src = photos[i];
        const imgBuf = await loadImageBuffer(src);
        if (!imgBuf) continue;

        // ensure enough space for image + caption
        ensureSpace(imgBoxHeight + 30);

        try {
          // center image by using fit and calculate x offset
          const fitWidth = contentWidth * 0.9;
          const x = doc.page.margins.left + (contentWidth - fitWidth) / 2;
          doc.image(imgBuf, x, doc.y, { fit: [fitWidth, imgBoxHeight], align: 'center' });
          // move cursor below image
          doc.moveTo(x, doc.y + imgBoxHeight + imgGap);
          doc.y = doc.y + imgBoxHeight + imgGap;
        } catch (e) {
          // fallback: skip problematic images
        }

        // optional caption
        const caption = (body.photo_captions && body.photo_captions[i]) || '';
        if (caption) {
          doc.fontSize(10).fillColor('#374151').text(caption, { width: contentWidth, align: 'center' });
          doc.moveDown(0.5);
        }
      }
    }

    doc.end();

    // wait for stream to finish
    await new Promise<void>((resolve) => stream.on('finish', () => resolve()));

    const buffer = stream.getContents();
    if (!buffer) throw new Error('Erro ao gerar o PDF');

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=laudo-tecnico.pdf',
      },
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('Error generating PDF', err);
    return NextResponse.json({ error: 'Erro ao gerar PDF' }, { status: 500 });
  }
}
