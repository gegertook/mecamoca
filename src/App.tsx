import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import KaryawanPage from './pages/KaryawanPage';
import SlipGajiPage from './pages/SlipGajiPage';
import LaporanPage from './pages/LaporanPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/karyawan"
            element={
              <ProtectedRoute>
                <Layout>
                  <KaryawanPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/slip-gaji"
            element={
              <ProtectedRoute>
                <Layout>
                  <SlipGajiPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/laporan"
            element={
              <ProtectedRoute>
                <Layout>
                  <LaporanPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
