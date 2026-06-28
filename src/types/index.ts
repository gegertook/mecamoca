// Tabel Karyawan & Slip Gaji - Types

export interface Karyawan {
  id: string;
  nama: string;
  jabatan: string;
  gaji_pokok: number;
}

export interface SlipGaji {
  id: string;
  karyawan_id: string;
  bulan: string;
  jumlah_masuk: number;
  gaji_hari: number;
  lembur: number;
  lembur_jam: number;
  uang_service: number;
  potongan: number;
  bon: number;
  total_gaji: number;
  created_at: string;
  karyawan?: Karyawan;
}

export interface DashboardStats {
  totalKaryawan: number;
  totalSlipBulanIni: number;
  totalPengeluaranBulanIni: number;
}
