'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function StoreAccessPage() {
  const [isPublic, setIsPublic] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const token = localStorage.getItem('rangrez_token');
        const response = await fetch('/api/admin/store-access', {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Could not load store status');
        setIsPublic(data.isPublic);
      } catch (loadError: any) {
        setError(loadError.message || 'Could not load store status');
      } finally {
        setIsLoading(false);
      }
    };

    loadStatus();
  }, []);

  const updateStatus = async () => {
    const nextIsPublic = !isPublic;
    if (!nextIsPublic && !window.confirm('Close the store to customers now?')) return;

    setIsSaving(true);
    setError('');
    setNotice('');
    try {
      const token = localStorage.getItem('rangrez_token');
      const response = await fetch('/api/admin/store-access', {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isPublic: nextIsPublic }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not update store status');
      setIsPublic(data.isPublic);
      setNotice(data.message);
    } catch (saveError: any) {
      setError(saveError.message || 'Could not update store status');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <header className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm text-gray-500">Admin</p>
              <h1 className="text-2xl font-bold text-gray-900">Store Access</h1>
            </div>
            <Link href="/admin/dashboard" className="text-sm font-medium text-gray-700 hover:text-black">
              Back to dashboard
            </Link>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8">
          <section className="max-w-2xl rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Customer visibility</p>
                <h2 className="mt-1 text-xl font-semibold text-gray-900">
                  {isPublic ? 'Store is public' : 'Store is closed'}
                </h2>
                <p className="mt-2 max-w-lg text-sm leading-6 text-gray-600">
                  {isPublic
                    ? 'Customers can browse Rangrez and start checkout.'
                    : 'Customers see a temporary closure page. Admin access stays available.'}
                </p>
              </div>

              <button
                type="button"
                onClick={updateStatus}
                disabled={isLoading || isSaving}
                aria-pressed={isPublic}
                className={`inline-flex min-w-36 items-center justify-center rounded-lg px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                  isPublic ? 'bg-emerald-700 hover:bg-emerald-800' : 'bg-gray-900 hover:bg-gray-800'
                }`}
              >
                {isLoading ? 'Loading…' : isSaving ? 'Saving…' : isPublic ? 'Turn store OFF' : 'Turn store ON'}
              </button>
            </div>

            <div className="mt-6 border-t border-gray-100 pt-5 text-sm text-gray-600">
              <p><span className="font-medium text-gray-900">ON:</span> Website and checkout are open to customers.</p>
              <p className="mt-2"><span className="font-medium text-gray-900">OFF:</span> Public pages and new orders are paused; admin remains available.</p>
            </div>

            {isLoading && <div className="mt-6"><LoadingSpinner /></div>}
            {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {notice && <p role="status" className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</p>}
          </section>
        </main>
      </div>
    </AdminGuard>
  );
}
