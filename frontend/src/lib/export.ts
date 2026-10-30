import * as XLSX from 'xlsx';

export type ExportRow = Record<string, string | number | boolean | null | undefined>;

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function exportCsv(rows: ExportRow[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = String(value ?? '').replace(/"/g, '""');
    return `"${text}"`;
  };
  const csv = [
    headers.map(escape).join(','),
    ...rows.map((row) => headers.map((header) => escape(row[header])).join(',')),
  ].join('\r\n');
  download(new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' }), filename);
}

export function exportXlsx(
  sheets: { name: string; rows: ExportRow[] }[],
  filename: string,
) {
  const workbook = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    const worksheet = XLSX.utils.json_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      sheet.name.slice(0, 31) || 'Datos',
    );
  });
  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  download(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename,
  );
}
