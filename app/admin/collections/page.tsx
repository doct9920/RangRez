'use client';

import { useEffect, useState } from 'react';

type Collection = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export default function CollectionsAdminPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  async function loadCollections() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/collections', {
        cache: 'no-store',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load collections');
      }

      setCollections(data.collections || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load collections');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCollections();
  }, []);

  async function createCollection(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Collection name is required');
      return;
    }

    try {
      setCreating(true);
      setError('');
      setMessage('');

      const response = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create collection');
      }

      setName('');
      setMessage(`"${data.collection.name}" created successfully.`);
      setCollections((current) => [...current, data.collection].sort((a, b) =>
        a.name.localeCompare(b.name)
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to create collection');
    } finally {
      setCreating(false);
    }
  }

  async function updateCollection() {
    if (!editingCollection) return;

    const trimmedName = editName.trim();

    if (!trimmedName) {
      setError('Collection name is required');
      return;
    }

    try {
      setSavingEdit(true);
      setError('');
      setMessage('');

      const response = await fetch(
        `/api/admin/collections?id=${encodeURIComponent(editingCollection.id)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: trimmedName,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update collection');
      }

      setCollections((current) =>
        current
          .map((item) =>
            item.id === editingCollection.id
              ? data.collection
              : item
          )
          .sort((a, b) => a.name.localeCompare(b.name))
      );

      setMessage(`"${data.collection.name}" updated successfully.`);
      setEditingCollection(null);
      setEditName('');
    } catch (err: any) {
      setError(err.message || 'Failed to update collection');
    } finally {
      setSavingEdit(false);
    }
  }
  async function deleteCollection(collection: Collection) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${collection.name}"?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(collection.id);
      setError('');
      setMessage('');

      const response = await fetch(
        `/api/admin/collections?id=${encodeURIComponent(collection.id)}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete collection');
      }

      setCollections((current) =>
        current.filter((item) => item.id !== collection.id)
      );

      setMessage(
        data.message || `"${collection.name}" deleted successfully.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to delete collection');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Collections
          </h1>
          <p className="mt-2 text-gray-600">
            Create and manage product collections.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Create New Collection
          </h2>

          <form onSubmit={createCollection} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Festive Collection"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
              disabled={creating}
            />

            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Collection'}
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-green-700">
              {message}
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-white shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              All Collections
            </h2>
          </div>

          {loading ? (
            <div className="p-6 text-gray-500">
              Loading collections...
            </div>
          ) : collections.length === 0 ? (
            <div className="p-6 text-gray-500">
              No collections found.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between px-6 py-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {collection.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      /collections/{collection.slug}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                      Active
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingCollection(collection);
                        setEditName(collection.name);
                        setError('');
                        setMessage('');
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteCollection(collection)}
                      disabled={deletingId === collection.id}
                      className="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === collection.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingCollection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              Edit Collection
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Rename this collection.
            </p>

            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Collection name"
              disabled={savingEdit}
              autoFocus
              className="mt-5 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-900"
            />

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setEditingCollection(null);
                  setEditName('');
                  setError('');
                }}
                disabled={savingEdit}
                className="rounded-lg border border-gray-300 px-5 py-2.5 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={updateCollection}
                disabled={savingEdit}
                className="rounded-lg bg-gray-900 px-5 py-2.5 font-medium text-white disabled:opacity-50"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
