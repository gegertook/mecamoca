-- ============================================================
-- CAFE MECAMOCA — Supabase Schema Setup
-- Run this ENTIRE script in your Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- ── 1. Tabel Karyawan ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS karyawan (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nama       TEXT NOT NULL,
  jabatan    TEXT,
  gaji_pokok BIGINT DEFAULT 0
);

-- ── 2. Tabel Slip Gaji ─────────────────────────────────────
-- bulan disimpan sebagai 'YYYY-MM', contoh: '2025-06'
CREATE TABLE IF NOT EXISTS slip_gaji (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  karyawan_id  uuid REFERENCES karyawan(id) ON DELETE CASCADE,
  bulan        TEXT NOT NULL,
  tunjangan    BIGINT DEFAULT 0,
  bonus        BIGINT DEFAULT 0,
  potongan     BIGINT DEFAULT 0,
  total_gaji   BIGINT DEFAULT 0,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ── 3. Enable Row Level Security ──────────────────────────
ALTER TABLE karyawan  ENABLE ROW LEVEL SECURITY;
ALTER TABLE slip_gaji ENABLE ROW LEVEL SECURITY;

-- ── 4. RLS Policies: Authenticated users (owner) only ─────

-- Karyawan
CREATE POLICY "auth_select_karyawan"  ON karyawan FOR SELECT  TO authenticated USING (true);
CREATE POLICY "auth_insert_karyawan"  ON karyawan FOR INSERT  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_karyawan"  ON karyawan FOR UPDATE  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_karyawan"  ON karyawan FOR DELETE  TO authenticated USING (true);

-- Slip Gaji
CREATE POLICY "auth_select_slip"  ON slip_gaji FOR SELECT  TO authenticated USING (true);
CREATE POLICY "auth_insert_slip"  ON slip_gaji FOR INSERT  TO authenticated WITH CHECK (true);
CREATE POLICY "auth_update_slip"  ON slip_gaji FOR UPDATE  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_delete_slip"  ON slip_gaji FOR DELETE  TO authenticated USING (true);

-- ── 5. Indexes for performance ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_slip_gaji_bulan       ON slip_gaji(bulan);
CREATE INDEX IF NOT EXISTS idx_slip_gaji_karyawan_id ON slip_gaji(karyawan_id);
