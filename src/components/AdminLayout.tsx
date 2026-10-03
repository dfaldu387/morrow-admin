'use client';

import { useEffect, useState, ReactNode, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from './Sidebar';

const AuthReadyContext = createContext(false);
export const useAuthReady = () => useContext(AuthReadyContext);

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.ok) {
          setOk(true);
        } else {
          localStorage.removeItem('admin_token');
          router.push('/login');
        }
      })
      .catch(() => {
        localStorage.removeItem('admin_token');
        router.push('/login');
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/login');
  };

  if (!ok) {
    return (
      <div className="loading" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <AuthReadyContext.Provider value={true}>
      <div className="app-layout">
        <Sidebar onLogout={handleLogout} />
        <main className="main-content">{children}</main>
      </div>
    </AuthReadyContext.Provider>
  );
}
