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

    // Helpers to render header/footer on each page
    const renderHeader = () => {
      doc.fontSize(14).fillColor('#111827').text('Laudo de Avaliação Técnica', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#6B7280').text(`Gerado em: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1);
      doc.strokeColor('#E5E7EB').moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();
      doc.moveDown(1);
    };

    const renderFooter = (pageNumber: number) => {
      const footerY = doc.page.height - doc.page.margins.bottom + 10;
      doc.fontSize(9).fillColor('#6B7280');
      doc.text(`Página ${pageNumber}`, doc.page.margins.left, footerY, { align: 'center', width: doc.page.width - doc.page.margins.left - doc.page.margins.right });
    };

    let pageNumber = 1;
    renderHeader();

    // Add content from body as structured text
    doc.fontSize(12).fillColor('#111827').text('1. Dados do Item Avaliado', { underline: false });
    doc.moveDown(0.5);

    const pushLabelValue = (label: string, value?: any) => {
      doc.fontSize(10).fillColor('#374151').text(`${label}: `, { continued: true });
      doc.font('Helvetica-Bold').text(value ?? '-', { continued: false });
    };

    pushLabelValue('Descrição', body['item-description']);
    pushLabelValue('Número de patrimônio', body['item-patrimony']);
    pushLabelValue('Quantidade', body['item-quantity']);
    pushLabelValue('Localização', body['item-location']);

    doc.moveDown(1);
    doc.font('Helvetica').moveDown(0.5);

    doc.fontSize(12).fillColor('#111827').text('2. Avaliação Técnica');
    doc.moveDown(0.5);
    pushLabelValue('Estado do item', body['item-state']);
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#374151').text('Diagnóstico técnico detalhado:');
    doc.moveDown(0.25);
    doc.font('Helvetica').text(body['item-diagnosis'] ?? '-', { align: 'left' });
    doc.moveDown(0.5);
    pushLabelValue('Reparo viável', body['repair-viable']);
    pushLabelValue('Custo estimado (R$)', body['repair-cost']);
    doc.moveDown(0.5);
    pushLabelValue('Recomendações', body['recommendations']);

    doc.addPage();
    pageNumber += 1;
    renderHeader();
    doc.fontSize(12).fillColor('#111827').text('3. Responsável pela Avaliação');
    doc.moveDown(0.5);
    pushLabelValue('Nome do técnico', body['tech-name']);
    pushLabelValue('Cargo/Função', body['tech-role']);

    // Footer for last page
    renderFooter(1);

    // For multi-page footers, we can add footer on pageAdded
    doc.on('pageAdded', () => {
      pageNumber += 1;
      renderFooter(pageNumber);
    });

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
