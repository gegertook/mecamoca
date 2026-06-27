import * as XLSX from 'xlsx';
import type { SlipGaji } from '../types';

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

export function exportExcel(slips: SlipGaji[], bulanLabel: string) {
  const rows = slips.map((s, i) => ({
    'No': i + 1,
    'Nama Karyawan': s.karyawan?.nama ?? '—',
    'Jabatan': s.karyawan?.jabatan ?? '—',
    'Gaji Pokok': s.karyawan?.gaji_pokok ?? 0,
    'Lembur Jam': s.lembur_jam ?? 0,
    'Lembur': s.lembur,
    'Bonus': s.bonus,
    'Potongan': s.potongan,
    'Total Gaji': s.total_gaji,
    'Gaji Pokok (Rp)': formatRupiah(s.karyawan?.gaji_pokok ?? 0),
    'Lembur (Rp)': formatRupiah(s.lembur),
    'Bonus (Rp)': formatRupiah(s.bonus),
    'Potongan (Rp)': formatRupiah(s.potongan),
    'Total Gaji (Rp)': formatRupiah(s.total_gaji),
  }));

  const displayRows = slips.map((s, i) => ({
    'No': i + 1,
    'Nama Karyawan': s.karyawan?.nama ?? '—',
    'Jabatan': s.karyawan?.jabatan ?? '—',
    'Gaji Pokok': s.karyawan?.gaji_pokok ?? 0,
    'Lembur Jam': s.lembur_jam ?? 0,
    'Lembur': s.lembur,
    'Bonus': s.bonus,
    'Potongan': s.potongan,
    'Total Gaji': s.total_gaji,
  }));

  const totalDisplayRow = {
    'No': '',
    'Nama Karyawan': 'TOTAL PENGELUARAN',
    'Jabatan': '',
    'Gaji Pokok': slips.reduce((sum, s) => sum + (s.karyawan?.gaji_pokok ?? 0), 0),
    'Lembur Jam': slips.reduce((sum, s) => sum + (s.lembur_jam ?? 0), 0),
    'Lembur': slips.reduce((sum, s) => sum + s.lembur, 0),
    'Bonus': slips.reduce((sum, s) => sum + s.bonus, 0),
    'Potongan': slips.reduce((sum, s) => sum + s.potongan, 0),
    'Total Gaji': slips.reduce((sum, s) => sum + s.total_gaji, 0),
  };

  const ws = XLSX.utils.json_to_sheet([]);

  // Title rows
  XLSX.utils.sheet_add_aoa(ws, [
    ['CAFE MECAMOCHA'],
    [`REKAP PENGGAJIAN — ${bulanLabel.toUpperCase()}`],
    [`Dicetak: ${new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' }).format(new Date())}`],
    [],
  ], { origin: 'A1' });

  // Data
  XLSX.utils.sheet_add_json(ws, [...displayRows, totalDisplayRow], { origin: 'A5', skipHeader: false });

  // Column widths
  ws['!cols'] = [
    { wch: 5 },  // No
    { wch: 25 }, // Nama Karyawan
    { wch: 18 }, // Jabatan
    { wch: 18 }, // Gaji Pokok
    { wch: 12 }, // Lembur Jam
    { wch: 15 }, // Lembur
    { wch: 15 }, // Bonus
    { wch: 15 }, // Potongan
    { wch: 18 }, // Total Gaji
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Penggajian ${bulanLabel}`);

  // Also add a raw numbers sheet
  const wsRaw = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, wsRaw, 'Data Mentah');

  XLSX.writeFile(wb, `Rekap_Penggajian_${bulanLabel.replace(/ /g, '_')}.xlsx`);
}
