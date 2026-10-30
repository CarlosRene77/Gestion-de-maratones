import { jsPDF } from 'jspdf';
import type { Certificado, Inscripcion, Usuario } from '@/types';
import { formatCurrency, formatDate, formatDateLong, fullName } from './utils';

const GREEN: [number, number, number] = [34, 197, 94];
const ORANGE: [number, number, number] = [249, 115, 22];
const INK: [number, number, number] = [15, 23, 42];
const MUTED: [number, number, number] = [100, 116, 139];

function safeFile(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

export function downloadCertificatePdf(cert: Certificado) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, w, h, 'F');
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(1.2);
  doc.rect(8, 8, w - 16, h - 16);
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.3);
  doc.rect(11, 11, w - 22, h - 22);

  doc.setFillColor(...GREEN);
  doc.rect(8, 8, 48, 2.5, 'F');
  doc.setFillColor(...ORANGE);
  doc.rect(w - 56, 8, 48, 2.5, 'F');

  doc.setTextColor(...GREEN);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('MARATHONHUB · CERTIFICADO OFICIAL', w / 2, 24, { align: 'center' });

  doc.setTextColor(248, 250, 252);
  doc.setFontSize(38);
  doc.text('CERTIFICADO DE FINISHER', w / 2, 44, { align: 'center' });

  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('Se certifica que', w / 2, 58, { align: 'center' });

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.text(
    `${cert.corredor.nombre} ${cert.corredor.apellido}`.toUpperCase(),
    w / 2,
    72,
    { align: 'center' },
  );

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(
    `completo la categoria ${cert.categoria.nombre_cat} (${cert.categoria.distancia_km} km)`,
    w / 2,
    82,
    { align: 'center' },
  );
  doc.text(`en ${cert.evento.nombre_evento}`, w / 2, 89, { align: 'center' });

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(30, 98, w - 60, 34, 3, 3, 'F');

  const cols = [
    { label: 'TIEMPO OFICIAL', value: cert.tiempo_neto },
    { label: 'POSICION CATEGORIA', value: cert.posicion_categoria ? `#${cert.posicion_categoria}` : '—' },
    { label: 'POSICION GENERO', value: cert.posicion_genero ? `#${cert.posicion_genero}` : '—' },
    { label: 'DORSAL', value: String(cert.numero_dorsal) },
  ];
  cols.forEach((col, index) => {
    const x = 30 + (w - 60) / cols.length * (index + 0.5);
    doc.setTextColor(...GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(col.label, x, 108, { align: 'center' });
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.text(String(col.value), x, 120, { align: 'center' });
  });

  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    `${cert.evento.ciudad || ''} · ${formatDateLong(cert.evento.fecha_evento)}`,
    w / 2,
    142,
    { align: 'center' },
  );
  doc.text(
    `Codigo de verificacion: ${cert.codigo_verificacion} · ${cert.leyenda}`,
    w / 2,
    148,
    { align: 'center' },
  );
  doc.setFontSize(8);
  doc.text(
    `Emitido el ${formatDate(cert.emitido_en, 'dd/MM/yyyy HH:mm')} · marathonhub.app`,
    w / 2,
    154,
    { align: 'center' },
  );

  doc.save(`certificado-${safeFile(cert.evento.nombre_evento)}-${cert.numero_dorsal}.pdf`);
}

export function downloadReceiptPdf(inscripcion: Inscripcion, user: Usuario) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const w = doc.internal.pageSize.getWidth();
  const categoria = inscripcion.categoria;
  const evento = categoria?.evento;

  doc.setFillColor(2, 6, 23);
  doc.rect(0, 0, w, 42, 'F');
  doc.setTextColor(...GREEN);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('MARATHONHUB', 18, 19);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprobante oficial de inscripcion', 18, 27);
  doc.setTextColor(148, 163, 184);
  doc.text(`Folio #${String(inscripcion.id_inscripcion).padStart(5, '0')}`, w - 18, 19, {
    align: 'right',
  });
  doc.text(formatDate(inscripcion.fecha_inscripcion, 'dd/MM/yyyy HH:mm'), w - 18, 27, {
    align: 'right',
  });

  doc.setFillColor(...GREEN);
  doc.rect(0, 42, w, 2, 'F');

  let y = 58;
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(evento?.nombre_evento || 'Evento MarathonHub', 18, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...MUTED);
  doc.text(
    `${formatDateLong(evento?.fecha_evento)} · ${evento?.ciudad || ''} ${evento?.lugar_salida ? `· ${evento.lugar_salida}` : ''}`,
    18,
    y,
  );

  y += 18;
  const rows: [string, string][] = [
    ['Corredor', fullName(user)],
    ['Email', user.email],
    ['Categoria', categoria?.nombre_cat || '—'],
    ['Distancia', categoria ? `${categoria.distancia_km} km` : '—'],
    ['Numero de dorsal', inscripcion.numero_dorsal ? String(inscripcion.numero_dorsal) : 'Pendiente de asignacion'],
    ['Talla de playera', inscripcion.talla_camiseta || '—'],
    ['Estado del pago', inscripcion.estado_pago === 'completado' ? 'Verificado' : inscripcion.estado_pago],
    ['Codigo de transaccion', inscripcion.codigo_transaccion || '—'],
  ];

  rows.forEach(([label, value], index) => {
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(18, y - 5, w - 36, 10, 'F');
    }
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(label, 22, y + 1);
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(String(value), w - 22, y + 1, { align: 'right' });
    y += 10;
  });

  y += 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(18, y, w - 18, y);
  y += 12;
  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Total pagado', 18, y);
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(formatCurrency(categoria?.precio), w - 18, y, { align: 'right' });

  y += 22;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(18, y, w - 36, 24, 3, 3, 'F');
  doc.setTextColor(22, 101, 52);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PRESENTA ESTE COMPROBANTE Y TU PASE DIGITAL EN LA ENTREGA DEL KIT', w / 2, y + 9, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.text(`Verifica tu pase en marathonhub.app · Dorsal ${inscripcion.numero_dorsal || 'pendiente'}`, w / 2, y + 16, {
    align: 'center',
  });

  doc.setTextColor(...MUTED);
  doc.setFontSize(8);
  doc.text(
    'Documento generado automaticamente. Conserva este comprobante para cualquier reclamo.',
    w / 2,
    doc.internal.pageSize.getHeight() - 16,
    { align: 'center' },
  );

  doc.save(`comprobante-${safeFile(evento?.nombre_evento || 'evento')}-${inscripcion.id_inscripcion}.pdf`);
}
