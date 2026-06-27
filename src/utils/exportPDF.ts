import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SlipGaji } from '../types';

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function getBulanLabel(bulan: string) {
  const [year, month] = bulan.split('-');
  const d = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d);
}

export function exportSlipPDF(slip: SlipGaji) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ── Header bar ──
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 0, pageW, 22, 'F');

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // dark
  doc.text('CAFE MECAMOCA', pageW / 2, 9, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Slip Gaji Karyawan', pageW / 2, 15, { align: 'center' });

  // ── Period ──
  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Periode: ${getBulanLabel(slip.bulan)}`, margin, 30);
  doc.text(
    `Dicetak: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())}`,
    pageW - margin,
    30,
    { align: 'right' }
  );

  // ── Divider ──
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.4);
  doc.line(margin, 33, pageW - margin, 33);

  // ── Employee Info ──
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text('Nama Karyawan', margin, 40);
  doc.text('Jabatan', margin, 47);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text(`: ${slip.karyawan?.nama ?? '—'}`, margin + 38, 40);
  doc.text(`: ${slip.karyawan?.jabatan ?? '—'}`, margin + 38, 47);

  // ── Salary Table ──
  const gajiPokok = slip.karyawan?.gaji_pokok ?? 0;
  autoTable(doc, {
    startY: 54,
    margin: { left: margin, right: margin },
    head: [['Komponen', 'Jumlah']],
    body: [
      ['Gaji Pokok', formatRupiah(gajiPokok)],
      ['Tunjangan', formatRupiah(slip.tunjangan)],
      ['Bonus', formatRupiah(slip.bonus)],
      ['Potongan', `(${formatRupiah(slip.potongan)})`],
    ],
    foot: [['Total Gaji', formatRupiah(slip.total_gaji)]],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], textColor: [251, 191, 36], fontStyle: 'bold' },
    footStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 10 },
    columnStyles: { 1: { halign: 'right' } },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 14;

  // ── Signature ──
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Mengetahui,', margin, finalY);
  doc.text('Owner Cafe MecaMoca', margin, finalY + 5);
  doc.line(margin, finalY + 22, margin + 40, finalY + 22);
  doc.text('(________________)', margin, finalY + 27);

  // ── Footer note ──
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text('Dokumen ini dicetak secara otomatis oleh Sistem Penggajian MecaMoca', pageW / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });

  doc.save(`Slip_Gaji_${slip.karyawan?.nama ?? 'Karyawan'}_${slip.bulan}.pdf`);
}

export function exportBulkPDF(slips: SlipGaji[], bulanLabel: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  // ── Header ──
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 0, pageW, 20, 'F');
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('CAFE MECAMOCA', pageW / 2, 9, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Rekap Penggajian — ${bulanLabel}`, pageW / 2, 15, { align: 'center' });

  const rows = slips.map((s, i) => [
    i + 1,
    s.karyawan?.nama ?? '—',
    s.karyawan?.jabatan ?? '—',
    formatRupiah(s.karyawan?.gaji_pokok ?? 0),
    formatRupiah(s.tunjangan),
    formatRupiah(s.bonus),
    formatRupiah(s.potongan),
    formatRupiah(s.total_gaji),
  ]);

  const total = slips.reduce((sum, s) => sum + s.total_gaji, 0);

  autoTable(doc, {
    startY: 26,
    margin: { left: margin, right: margin },
    head: [['No', 'Nama Karyawan', 'Jabatan', 'Gaji Pokok', 'Tunjangan', 'Bonus', 'Potongan', 'Total Gaji']],
    body: rows,
    foot: [['', '', '', '', '', '', 'Total Pengeluaran', formatRupiah(total)]],
    styles: { fontSize: 8, cellPadding: 2.5 },
    headStyles: { fillColor: [30, 41, 59], textColor: [251, 191, 36], fontStyle: 'bold' },
    footStyles: { fillColor: [245, 158, 11], textColor: [15, 23, 42], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right', fontStyle: 'bold' },
    },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  doc.save(`Rekap_Penggajian_${bulanLabel.replace(/ /g, '_')}.pdf`);
}
