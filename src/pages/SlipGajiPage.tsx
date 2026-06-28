import { useEffect, useState } from 'react';
import { Plus, Trash2, Download, FileText, X, Calculator } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { Karyawan, SlipGaji } from '../types';
import { exportSlipPDF } from '../utils/exportPDF';

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

const emptyForm = { karyawan_id: '', bulan: currentMonthKey, jumlah_masuk: '26', lembur: '', lembur_jam: '', uang_service: '', potongan: '', bon: '' };

export default function SlipGajiPage() {
  const [slips, setSlips] = useState<SlipGaji[]>([]);
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);
  const [filterBulan, setFilterBulan] = useState(currentMonthKey);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchKaryawan(); }, []);
  useEffect(() => { fetchSlips(); }, [filterBulan]);

  const fetchKaryawan = async () => {
    const { data } = await supabase.from('karyawan').select('*').order('nama');
    setKaryawanList(data ?? []);
  };

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

  const selectedKaryawan = karyawanList.find(k => k.id === form.karyawan_id);
  const gajiPokok = selectedKaryawan?.gaji_pokok ?? 0;
  const gajiHari = Math.round(gajiPokok / 26);
  const jumlahMasuk = form.jumlah_masuk === '' ? 26 : Number(form.jumlah_masuk);
  const lembur = Number(form.lembur) || 0;
  const lembur_jam = Number(form.lembur_jam) || 0;
  const uang_service = Number(form.uang_service) || 0;
  const potongan = Number(form.potongan) || 0;
  const bon = Number(form.bon) || 0;
  const totalGaji = Math.round((gajiHari * jumlahMasuk) + lembur + uang_service - potongan - bon);

  const openCreate = () => {
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setForm(emptyForm); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.karyawan_id) { setError('Pilih karyawan terlebih dahulu'); return; }
    setSaving(true);
    setError('');

    const payload = {
      karyawan_id: form.karyawan_id,
      bulan: form.bulan,
      jumlah_masuk: jumlahMasuk,
      gaji_hari: gajiHari,
      lembur,
      lembur_jam,
      uang_service,
      potongan,
      bon,
      total_gaji: totalGaji,
    };

    const { error: err } = await supabase.from('slip_gaji').insert(payload);
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false);
    closeModal();
    fetchSlips();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('slip_gaji').delete().eq('id', deleteId);
    setDeleteId(null);
    fetchSlips();
  };

  const handleDownloadPDF = (slip: SlipGaji) => {
    exportSlipPDF(slip);
  };

  const bulanLabel = monthOptions.find(m => m.value === filterBulan)?.label ?? filterBulan;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Slip Gaji</h1>
          <p className="text-gray-500 text-sm mt-1">{slips.length} slip pada {bulanLabel}</p>
        </div>
        <button id="btn-buat-slip" onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Buat Slip Gaji
        </button>
      </div>

      {/* Filter Bulan */}
      <div className="flex items-center gap-3">
        <label className="text-gray-400 text-sm whitespace-nowrap">Filter Bulan:</label>
        <select
          id="filter-bulan"
          value={filterBulan}
          onChange={e => setFilterBulan(e.target.value)}
          className="input-field max-w-xs"
        >
          {monthOptions.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : slips.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-800/60 flex items-center justify-center">
              <FileText size={20} className="text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">Belum ada slip gaji untuk {bulanLabel}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Nama Karyawan</th>
                  <th className="table-header">Gaji Pokok</th>
                  <th className="table-header">Gaji (Hari)</th>
                  <th className="table-header">Masuk</th>
                  <th className="table-header">Lembur</th>
                  <th className="table-header">Uang Servis</th>
                  <th className="table-header">Potongan</th>
                  <th className="table-header">Bon</th>
                  <th className="table-header">Total Gaji</th>
                  <th className="table-header text-right pr-5">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {slips.map(slip => (
                  <tr key={slip.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="table-cell font-medium text-white">{slip.karyawan?.nama ?? '—'}</td>
                    <td className="table-cell">{formatRupiah(slip.karyawan?.gaji_pokok ?? 0)}</td>
                    <td className="table-cell">{formatRupiah(slip.gaji_hari ?? Math.round((slip.karyawan?.gaji_pokok ?? 0) / 26))}</td>
                    <td className="table-cell text-gray-300">{slip.jumlah_masuk ?? 26} hari</td>
                    <td className="table-cell text-emerald-400">
                      <div>{formatRupiah(slip.lembur)}</div>
                      <div className="text-xs text-gray-500">{slip.lembur_jam ?? 0} jam</div>
                    </td>
                    <td className="table-cell text-blue-400">{formatRupiah(slip.uang_service)}</td>
                    <td className="table-cell text-red-400">{formatRupiah(slip.potongan)}</td>
                    <td className="table-cell text-amber-500">{formatRupiah(slip.bon ?? 0)}</td>
                    <td className="table-cell font-bold text-amber-400">{formatRupiah(slip.total_gaji)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`btn-pdf-${slip.id}`}
                          onClick={() => handleDownloadPDF(slip)}
                          className="p-1.5 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                          title="Unduh PDF"
                        >
                          <Download size={14} />
                        </button>
                        <button
                          id={`btn-del-slip-${slip.id}`}
                          onClick={() => setDeleteId(slip.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Slip Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content max-w-xl">
            <div className="modal-header">
              <h2 className="text-white font-semibold">Buat Slip Gaji</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-300 transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg px-4 py-3 text-sm">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">Karyawan <span className="text-red-400">*</span></label>
                    <select
                      id="select-karyawan"
                      value={form.karyawan_id}
                      onChange={e => setForm(f => ({ ...f, karyawan_id: e.target.value }))}
                      className="input-field"
                    >
                      <option value="">-- Pilih Karyawan --</option>
                      {karyawanList.map(k => (
                        <option key={k.id} value={k.id}>{k.nama} — {k.jabatan}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="label">Bulan</label>
                    <select
                      id="select-bulan"
                      value={form.bulan}
                      onChange={e => setForm(f => ({ ...f, bulan: e.target.value }))}
                      className="input-field"
                    >
                      {monthOptions.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>
                  {selectedKaryawan && (
                    <div className="col-span-2 grid grid-cols-2 gap-4 bg-gray-800/40 rounded-xl px-4 py-3 border border-gray-700/30">
                      <div>
                        <p className="text-gray-400 text-xs">Gaji Pokok</p>
                        <p className="text-amber-400 font-semibold mt-0.5">{formatRupiah(gajiPokok)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Gaji (Hari) <span className="text-[10px] text-gray-500">(Gaji Pokok / 26)</span></p>
                        <p className="text-amber-400 font-semibold mt-0.5">{formatRupiah(gajiHari)}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="label">Jumlah Masuk (Hari)</label>
                    <input id="input-jumlah-masuk" type="number" min="0" max="31" step="0.5" value={form.jumlah_masuk} onChange={e => setForm(f => ({ ...f, jumlah_masuk: e.target.value }))} placeholder="26" className="input-field" />
                  </div>
                  <div>
                    <label className="label">Jam Lembur</label>
                    <input id="input-lembur-jam" type="number" min="0" value={form.lembur_jam} onChange={e => setForm(f => ({ ...f, lembur_jam: e.target.value }))} placeholder="0" className="input-field" />
                  </div>
                  <div>
                    <label className="label">Lembur (Rp)</label>
                    <input id="input-lembur" type="number" min="0" value={form.lembur} onChange={e => setForm(f => ({ ...f, lembur: e.target.value }))} placeholder="0" className="input-field" />
                  </div>
                  <div>
                    <label className="label">Uang Servis (Rp)</label>
                    <input id="input-uang-service" type="number" min="0" value={form.uang_service} onChange={e => setForm(f => ({ ...f, uang_service: e.target.value }))} placeholder="0" className="input-field" />
                  </div>
                  <div>
                    <label className="label">Potongan (Rp)</label>
                    <input id="input-potongan" type="number" min="0" value={form.potongan} onChange={e => setForm(f => ({ ...f, potongan: e.target.value }))} placeholder="0" className="input-field" />
                  </div>
                  <div>
                    <label className="label">Bon (Rp)</label>
                    <input id="input-bon" type="number" min="0" value={form.bon} onChange={e => setForm(f => ({ ...f, bon: e.target.value }))} placeholder="0" className="input-field" />
                  </div>
                  <div>
                    <label className="label">Total Gaji</label>
                    <div className={`rounded-xl px-4 py-2.5 border text-sm font-bold ${totalGaji >= 0 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                      <div className="flex items-center gap-2">
                        <Calculator size={14} />
                        {formatRupiah(totalGaji)}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  Total = (Gaji (Hari) × Jumlah Masuk) + Lembur (Rp) + Uang Servis − Potongan − Bon
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn-secondary">Batal</button>
                <button id="btn-simpan-slip" type="submit" disabled={saving} className="btn-primary">
                  {saving ? <><div className="w-3.5 h-3.5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" /> Menyimpan...</> : 'Simpan Slip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="bg-gray-900 border border-gray-800/70 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Hapus Slip Gaji</h3>
                <p className="text-gray-500 text-sm">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button id="btn-confirm-del-slip" onClick={handleDelete} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl py-2.5 transition-all border border-red-500/30 text-sm">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
