import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Users, Search, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import type { Karyawan } from '../types';

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

const emptyForm = { nama: '', jabatan: '', gaji_pokok: '' };

export default function KaryawanPage() {
  const [karyawan, setKaryawan] = useState<Karyawan[]>([]);
  const [filtered, setFiltered] = useState<Karyawan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Karyawan | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchKaryawan(); }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(karyawan.filter(k =>
      k.nama.toLowerCase().includes(q) || k.jabatan?.toLowerCase().includes(q)
    ));
  }, [search, karyawan]);

  const fetchKaryawan = async () => {
    setLoading(true);
    const { data } = await supabase.from('karyawan').select('*').order('nama');
    setKaryawan(data ?? []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (k: Karyawan) => {
    setEditing(k);
    setForm({ nama: k.nama, jabatan: k.jabatan ?? '', gaji_pokok: k.gaji_pokok.toString() });
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama.trim()) { setError('Nama wajib diisi'); return; }
    setSaving(true);
    setError('');
    const payload = { nama: form.nama.trim(), jabatan: form.jabatan.trim(), gaji_pokok: Number(form.gaji_pokok) || 0 };

    if (editing) {
      const { error } = await supabase.from('karyawan').update(payload).eq('id', editing.id);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from('karyawan').insert(payload);
      if (error) { setError(error.message); setSaving(false); return; }
    }
    setSaving(false);
    closeModal();
    fetchKaryawan();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('karyawan').delete().eq('id', deleteId);
    setDeleteId(null);
    fetchKaryawan();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Manajemen Karyawan</h1>
          <p className="text-gray-500 text-sm mt-1">{karyawan.length} karyawan terdaftar</p>
        </div>
        <button id="btn-tambah-karyawan" onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Tambah Karyawan
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          id="search-karyawan"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cari nama atau jabatan..."
          className="input-field pl-9"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-800/60 flex items-center justify-center">
              <Users size={20} className="text-gray-600" />
            </div>
            <p className="text-gray-500 text-sm">{search ? 'Tidak ada hasil pencarian' : 'Belum ada karyawan'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header">Nama</th>
                  <th className="table-header">Jabatan</th>
                  <th className="table-header">Gaji Pokok</th>
                  <th className="table-header text-right pr-5">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(k => (
                  <tr key={k.id} className="hover:bg-gray-800/30 transition-colors group">
                    <td className="table-cell font-medium text-white">{k.nama}</td>
                    <td className="table-cell">
                      <span className="badge bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {k.jabatan || '—'}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-amber-400">{formatRupiah(k.gaji_pokok)}</td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          id={`btn-edit-${k.id}`}
                          onClick={() => openEdit(k)}
                          className="p-1.5 text-gray-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          id={`btn-delete-${k.id}`}
                          onClick={() => setDeleteId(k.id)}
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

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="text-white font-semibold">{editing ? 'Edit Karyawan' : 'Tambah Karyawan'}</h2>
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
                <div>
                  <label className="label">Nama Lengkap <span className="text-red-400">*</span></label>
                  <input id="input-nama" value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Contoh: Budi Santoso" className="input-field" />
                </div>
                <div>
                  <label className="label">Jabatan</label>
                  <input id="input-jabatan" value={form.jabatan} onChange={e => setForm(f => ({ ...f, jabatan: e.target.value }))} placeholder="Contoh: Barista" className="input-field" />
                </div>
                <div>
                  <label className="label">Gaji Pokok (Rp)</label>
                  <input id="input-gaji-pokok" type="number" min="0" value={form.gaji_pokok} onChange={e => setForm(f => ({ ...f, gaji_pokok: e.target.value }))} placeholder="Contoh: 3000000" className="input-field" />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn-secondary">Batal</button>
                <button id="btn-simpan-karyawan" type="submit" disabled={saving} className="btn-primary">
                  {saving ? <><div className="w-3.5 h-3.5 border-2 border-gray-950/30 border-t-gray-950 rounded-full animate-spin" /> Menyimpan...</> : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="bg-gray-900 border border-gray-800/70 rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <Trash2 size={18} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Hapus Karyawan</h3>
                <p className="text-gray-500 text-sm">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-5">
              Data karyawan dan semua slip gaji terkait akan dihapus permanen.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button id="btn-confirm-delete" onClick={handleDelete} className="flex-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold rounded-xl py-2.5 transition-all border border-red-500/30 text-sm">
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
