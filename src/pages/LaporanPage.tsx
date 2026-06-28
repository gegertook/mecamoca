import { useEffect, useState } from 'react';
import { BarChart3, Download, FileSpreadsheet, FileDown } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { SlipGaji } from '../types';
import { exportSlipPDF, exportBulkPDF } from '../utils/exportPDF';
import { exportExcel } from '../utils/exportExcel';

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function getMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = -12; i <= 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(d);
    options.push({ value, label });
  }
  options.sort((a, b) => b.value.localeCompare(a.value));
  return options;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const monthOptions = getMonthOptions();
const currentMonthKey = getCurrentMonthKey();

export default function LaporanPage() {
  const [slips, setSlips] = useState<SlipGaji[]>([]);
  const [filterBulan, setFilterBulan] = useState(currentMonthKey);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchSlips(); }, [filterBulan]);

  const fetchSlips = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('slip_gaji')
      .select('*, karyawan(id, nama, jabatan, gaji_pokok)')
      .eq('bulan', filterBulan)
      .order('created_at', { ascending: false });
    setSlips((data ?? []) as SlipGaji[]);
    setLoading(false);
  };

  const bulanLabel = monthOptions.find(m => m.value === filterBulan)?.label ?? filterBulan;
  const totalPengeluaran = slips.reduce((sum, s) => sum + (s.total_gaji ?? 0), 0);

  const handleExcelExport = () => {
    exportExcel(slips, bulanLabel);
  };

  const handleBulkPDF = () => {
    exportBulkPDF(slips, bulanLabel);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Laporan Penggajian</h1>
        <p className="text-gray-500 text-sm mt-1">Rekap dan ekspor data penggajian per bulan</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <label className="text-gray-400 text-sm whitespace-nowrap">Pilih Bulan:</label>
          <select
            id="laporan-filter-bulan"
            value={filterBulan}
            onChange={e => setFilterBulan(e.target.value)}
            className="input-field max-w-xs"
          >
            {monthOptions.map(m => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3 sm:ml-auto">
          <button
            id="btn-export-excel"
            onClick={handleExcelExport}
            disabled={slips.length === 0}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet size={16} className="text-emerald-400" />
            Export Excel
          </button>
          <button
            id="btn-export-pdf-bulk"
            onClick={handleBulkPDF}
            disabled={slips.length === 0}
            className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileDown size={16} className="text-red-400" />
            Export PDF Bulk
          </button>
        </div>
      </div>

      {/* Summary */}
      {!loading && slips.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="card p-4 border border-gray-700/30">
            <p className="text-gray-500 text-xs">Total Karyawan</p>
            <p className="text-white font-bold text-xl mt-1">{slips.length}</p>
          </div>
          <div className="card p-4 border border-amber-500/20">
            <p className="text-gray-500 text-xs">Total Pengeluaran</p>
            <p className="text-amber-400 font-bold text-xl mt-1">{formatRupiah(totalPengeluaran)}</p>
          </div>
          <div className="card p-4 border border-gray-700/30 col-span-2 sm:col-span-1">
            <p className="text-gray-500 text-xs">Rata-rata Gaji</p>
            <p className="text-white font-bold text-xl mt-1">{formatRupiah(totalPengeluaran / slips.length)}</p>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-800/50">
          <BarChart3 size={16} className="text-amber-400" />
          <h2 className="text-white font-semibold text-sm">Rekap Penggajian — {bulanLabel}</h2>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slips.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-800/60 flex items-center justify-center">
              <BarChart3 size={20} className="text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">Tidak ada data untuk {bulanLabel}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">No</th>
                  <th className="table-header">Nama Karyawan</th>
                  <th className="table-header">Gaji Pokok</th>
                  <th className="table-header">Lembur</th>
                  <th className="table-header">Uang Servis</th>
                  <th className="table-header">Potongan</th>
                  <th className="table-header">Bon</th>
                  <th className="table-header">Total Gaji</th>
                  <th className="table-header text-center">PDF</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((slip, idx) => (
                  <tr key={slip.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="table-cell text-gray-500">{idx + 1}</td>
                    <td className="table-cell font-medium text-white">{slip.karyawan?.nama ?? '—'}</td>
                    <td className="table-cell">{formatRupiah(slip.karyawan?.gaji_pokok ?? 0)}</td>
                    <td className="table-cell text-emerald-400">
                      <div>{formatRupiah(slip.lembur)}</div>
                      <div className="text-xs text-gray-500">{slip.lembur_jam ?? 0} jam</div>
                    </td>
                    <td className="table-cell text-blue-400">{formatRupiah(slip.uang_service)}</td>
                    <td className="table-cell text-red-400">{formatRupiah(slip.potongan)}</td>
                    <td className="table-cell text-amber-500">{formatRupiah(slip.bon ?? 0)}</td>
                    <td className="table-cell font-bold text-amber-400">{formatRupiah(slip.total_gaji)}</td>
                    <td className="table-cell text-center">
                      <button
                        id={`laporan-pdf-${slip.id}`}
                        onClick={() => exportSlipPDF(slip)}
                        className="p-1.5 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all mx-auto"
                        title="Unduh PDF"
                      >
                        <Download size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-800/40">
                  <td colSpan={7} className="px-4 py-3 text-right text-sm font-semibold text-gray-300">
                    Total Pengeluaran
                  </td>
                  <td className="px-4 py-3 text-amber-400 font-bold text-sm">{formatRupiah(totalPengeluaran)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
