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
