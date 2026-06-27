import { useEffect, useState } from 'react';
import { Users, FileText, TrendingUp, Clock, Coffee } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { SlipGaji } from '../types';

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function getCurrentMonthLabel() {
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date());
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function DashboardPage() {
  const [totalKaryawan, setTotalKaryawan] = useState(0);
  const [totalSlip, setTotalSlip] = useState(0);
  const [totalPengeluaran, setTotalPengeluaran] = useState(0);
  const [recentSlip, setRecentSlip] = useState<SlipGaji[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const bulanIni = getCurrentMonthKey();

    const [{ count: karyawanCount }, { data: slipData }] = await Promise.all([
      supabase.from('karyawan').select('*', { count: 'exact', head: true }),
      supabase
        .from('slip_gaji')
        .select('*, karyawan(nama, jabatan)')
        .eq('bulan', bulanIni)
        .order('created_at', { ascending: false }),
    ]);

    setTotalKaryawan(karyawanCount ?? 0);
    setTotalSlip(slipData?.length ?? 0);
    setTotalPengeluaran(slipData?.reduce((sum, s) => sum + (s.total_gaji ?? 0), 0) ?? 0);
    setRecentSlip((slipData ?? []).slice(0, 5) as SlipGaji[]);
    setLoading(false);
  };

  const stats = [
    {
      label: 'Total Karyawan',
      value: loading ? '—' : totalKaryawan.toString(),
      icon: Users,
      color: 'from-blue-500/20 to-blue-600/10',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/20',
    },
    {
      label: 'Slip Bulan Ini',
      value: loading ? '—' : totalSlip.toString(),
      icon: FileText,
      color: 'from-emerald-500/20 to-emerald-600/10',
      iconColor: 'text-emerald-400',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: 'Total Pengeluaran',
      value: loading ? '—' : formatRupiah(totalPengeluaran),
      icon: TrendingUp,
      color: 'from-amber-500/20 to-amber-600/10',
      iconColor: 'text-amber-400',
      borderColor: 'border-amber-500/20',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Ringkasan penggajian {getCurrentMonthLabel()}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(({ label, value, icon: Icon, color, iconColor, borderColor }) => (
          <div key={label} className={`card p-5 border ${borderColor} bg-gradient-to-br ${color}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-400 text-sm">{label}</p>
                <p className={`text-2xl font-bold text-white mt-1 ${loading ? 'animate-pulse' : ''}`}>
                  {value}
                </p>
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gray-800/60 flex items-center justify-center ${iconColor}`}>
                <Icon size={20} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Slips Table */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-400" />
            <h2 className="font-semibold text-white text-sm">Slip Gaji Terbaru Bulan Ini</h2>
          </div>
        </div>

        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recentSlip.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-800/60 flex items-center justify-center">
              <Coffee size={20} className="text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">Belum ada slip gaji bulan ini</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header rounded-tl-none">Nama Karyawan</th>
                  <th className="table-header">Jabatan</th>
                  <th className="table-header">Bulan</th>
                  <th className="table-header text-right">Total Gaji</th>
                </tr>
              </thead>
              <tbody>
                {recentSlip.map((slip) => (
                  <tr key={slip.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="table-cell font-medium text-white">{slip.karyawan?.nama ?? '—'}</td>
                    <td className="table-cell">{slip.karyawan?.jabatan ?? '—'}</td>
                    <td className="table-cell">
                      <span className="badge bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {slip.bulan}
                      </span>
                    </td>
                    <td className="table-cell text-right font-semibold text-emerald-400">
                      {formatRupiah(slip.total_gaji)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
