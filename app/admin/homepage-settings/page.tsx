'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminGuard from '@/components/AdminGuard';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import ImageCropper from '@/components/ImageCropper';
import { shopCategories } from '@/lib/categories';
import { uploadImageToCdn } from '@/lib/upload-client';

interface HomepageSettings {
  id: string;
  heroBannerImage: string | null;
  heroSlides: string[];
  collectionImages: Record<string, string>;
}

interface Collection {
  id: string;
  name: string;
  slug: string;
  isVisible: boolean;
}

export default function HomepageSettingsPage() {
  const router = useRouter();

  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isCollectionLoading, setIsCollectionLoading] = useState(true);

  const [newCollectionName, setNewCollectionName] = useState('');
  const [isAddingCollection, setIsAddingCollection] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState<Record<string, string>>({
    heroSlide1: '',
    heroSlide2: '',
    heroSlide3: '',
    ...Object.fromEntries(
      shopCategories.map((category) => [category.slug, ''])
    ),
  });

  const [imageToCrop, setImageToCrop] = useState<{
    type: string;
    data: string;
  } | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('rangrez_token');

        const response = await fetch('/api/admin/homepage-settings', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch homepage settings');
        }

        const data = await response.json();

        setSettings(data.settings);

        setFormData({
          heroSlide1:
            data.settings.heroSlides?.[0] ||
            data.settings.heroBannerImage ||
            '',
          heroSlide2: data.settings.heroSlides?.[1] || '',
          heroSlide3: data.settings.heroSlides?.[2] || '',
          ...Object.fromEntries(
            shopCategories.map((category) => [
              category.slug,
              data.settings.collectionImages?.[category.slug] || '',
            ])
          ),
        });
      } catch (err) {
        console.error('Error fetching homepage settings:', err);
        setError('Failed to load homepage settings');
      } finally {
        setIsLoading(false);
      }
    };

    const fetchCollections = async () => {
      try {
        const token = localStorage.getItem('rangrez_token');

        const response = await fetch('/api/admin/collections', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch collections');
        }

        const data = await response.json();

        setCollections(data.collections || []);
      } catch (err) {
        console.error('Error fetching collections:', err);
        setError('Failed to load collections');
      } finally {
        setIsCollectionLoading(false);
      }
    };

    fetchSettings();
    fetchCollections();
  }, []);

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) {
        reject(
          new Error(
            `File "${file.name}" is too large. Maximum size is 10MB.`
          )
        );
        return;
      }

      const validTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
      ];

      const validExtensions = [
        '.jpg',
        '.jpeg',
        '.png',
        '.webp',
        '.gif',
      ];

      const fileExtension =
        '.' + file.name.split('.').pop()?.toLowerCase();

      if (
        !validTypes.includes(file.type) &&
        !validExtensions.includes(fileExtension)
      ) {
        reject(
          new Error(
            `File "${file.name}" is not a recognized image file.`
          )
        );
        return;
      }

      const reader = new FileReader();

      reader.onloadend = () => {
        if (reader.result && typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error(`Failed to read file "${file.name}"`));
        }
      };

      reader.onerror = () =>
        reject(new Error(`Error reading file "${file.name}"`));

      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (
    type: string,
    file: File | null
  ) => {
    if (!file) return;

    try {
      const imageData = await processFile(file);
      setImageToCrop({
        type,
        data: imageData,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to process image');
    }
  };

  const saveHomepageSettings = async (
    updatedFormData: Record<string, string>
  ) => {
    const token = localStorage.getItem('rangrez_token');

    if (!token) {
      throw new Error('Admin session expired. Please login again.');
    }

    const collectionImages: Record<string, string> = {};

    collections.forEach((collection) => {
      const image = updatedFormData[collection.slug];

      if (image && image.trim()) {
        collectionImages[collection.slug] = image;
      }
    });

    const heroSlides = [
      updatedFormData.heroSlide1,
      updatedFormData.heroSlide2,
      updatedFormData.heroSlide3,
    ].filter(
      (image): image is string =>
        Boolean(image && image.trim())
    );

    const response = await fetch(
      '/api/admin/homepage-settings',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          heroSlides,
          collectionImages,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result?.error ||
          `Failed to save image (${response.status})`
      );
    }

    return result.settings;
  };
    const handleAddCollection = async () => {
    const name = newCollectionName.trim();

    if (!name) {
      setError('Collection name is required');
      return;
    }

    try {
      setError('');
      setSuccess('');
      setIsCreatingCollection(true);

      const token = localStorage.getItem('rangrez_token');

      const response = await fetch('/api/admin/collections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error || 'Failed to create collection'
        );
      }

      setCollections((prev) =>
        [...prev, result.collection].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      );

      setNewCollectionName('');
      setIsAddingCollection(false);

      setSuccess(
        `Collection "${name}" created successfully!`
      );
    } catch (err: any) {
      console.error('ADD COLLECTION ERROR:', err);
      setError(err.message || 'Failed to create collection');
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const handleCropComplete = async (
    croppedImage: string,
    type: string
  ) => {
    setImageToCrop(null);
    setError('');
    setSuccess('');
    setIsUploading(true);

    try {
      // 1. ImageKit par upload
      const url = await uploadImageToCdn(croppedImage, {
        fileName: `${type}-${Date.now()}`,
        folder: type.startsWith('heroSlide')
          ? 'hero'
          : 'collections',
      });

      // 2. Current form data + new image
      const updatedFormData = {
        ...formData,
        [type]: url,
      };

      // 3. Screen par image show karo
      setFormData(updatedFormData);

      // 4. Database me immediately save karo
      const savedSettings =
        await saveHomepageSettings(updatedFormData);

      // 5. Database ke saved data ke saath state sync karo
      setSettings(savedSettings);

      setSuccess(
        'Image uploaded and permanently saved!'
      );

      console.log('IMAGE PERMANENTLY SAVED:', {
        type,
        url,
      });
    } catch (err: any) {
      console.error('IMAGE SAVE ERROR:', err);
      setError(
        err.message || 'Image upload/save failed'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditCollection = async (
    collection: Collection
  ) => {
    const newName = window.prompt(
      'Enter new collection name:',
      collection.name
    );

    if (
      !newName ||
      !newName.trim() ||
      newName.trim() === collection.name
    ) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const token =
        localStorage.getItem('rangrez_token');

      const response = await fetch(
        `/api/admin/collections?id=${collection.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newName.trim(),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'Failed to update collection'
        );
      }

      setCollections((prev) =>
        prev
          .map((item) =>
            item.id === collection.id
              ? result.collection
              : item
          )
          .sort((a, b) =>
            a.name.localeCompare(b.name)
          )
      );

      // Agar slug change hua hai to image key bhi move karo
      if (
        result.collection.slug !== collection.slug
      ) {
        setFormData((prev) => {
          const next = { ...prev };

          if (prev[collection.slug]) {
            next[result.collection.slug] =
              prev[collection.slug];
            delete next[collection.slug];
          }

          return next;
        });
      }

      setSuccess(
        `"${newName.trim()}" updated successfully.`
      );
    } catch (err: any) {
      console.error(
        'EDIT COLLECTION ERROR:',
        err
      );
      setError(
        err.message ||
          'Failed to update collection'
      );
    }
  };

  const handleToggleCollection = async (
    collection: Collection
  ) => {
    try {
      setError('');
      setSuccess('');

      const token =
        localStorage.getItem('rangrez_token');

      const response = await fetch(
        `/api/admin/collections?id=${collection.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            isVisible: !collection.isVisible,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'Failed to update collection visibility'
        );
      }

      setCollections((prev) =>
        prev.map((item) =>
          item.id === collection.id
            ? result.collection
            : item
        )
      );

      setSuccess(
        `"${collection.name}" is now ${
          result.collection.isVisible
            ? 'visible'
            : 'hidden'
        }.`
      );
    } catch (err: any) {
      console.error(
        'TOGGLE COLLECTION ERROR:',
        err
      );
      setError(
        err.message ||
          'Failed to update collection'
      );
    }
  };

  const handleDeleteCollection = async (
    collection: Collection
  ) => {
    const confirmed = window.confirm(
      `Delete collection "${collection.name}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccess('');

      const token =
        localStorage.getItem('rangrez_token');

      const response = await fetch(
        `/api/admin/collections?id=${collection.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            'Failed to delete collection'
        );
      }

      setCollections((prev) =>
        prev.filter(
          (item) => item.id !== collection.id
        )
      );

      setFormData((prev) => {
        const next = { ...prev };
        delete next[collection.slug];
        return next;
      });

      setSuccess(
        `"${collection.name}" deleted successfully.`
      );
    } catch (err: any) {
      console.error(
        'DELETE COLLECTION ERROR:',
        err
      );
      setError(
        err.message ||
          'Failed to delete collection'
      );
    }
  };
    const handleSubmit = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('rangrez_token');

      if (!token) {
        throw new Error(
          'Admin session expired. Please login again.'
        );
      }

      const collectionImages: Record<string, string> = {};

      // Database wali collections ki images save karo
      collections.forEach((collection) => {
        const image = formData[collection.slug];

        if (image && image.trim()) {
          collectionImages[collection.slug] = image;
        }
      });

      const heroSlides = [
        formData.heroSlide1,
        formData.heroSlide2,
        formData.heroSlide3,
      ].filter(
        (image): image is string =>
          Boolean(image && image.trim())
      );

      const updateData = {
        heroSlides,
        collectionImages,
      };

      console.log('SAVE START:', updateData);

      const response = await fetch(
        '/api/admin/homepage-settings',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      const result = await response.json();

      console.log('SAVE RESPONSE:', result);

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Save failed (${response.status})`
        );
      }

      // Database se jo save hua hai wahi frontend state me rakho
      if (result.settings) {
        setSettings(result.settings);

        setFormData((prev) => ({
          ...prev,

          heroSlide1:
            result.settings.heroSlides?.[0] || '',
          heroSlide2:
            result.settings.heroSlides?.[1] || '',
          heroSlide3:
            result.settings.heroSlides?.[2] || '',

          // Existing form data ko preserve karte hue
          // database ki collection images update karo
          ...Object.fromEntries(
            collections.map((collection) => [
              collection.slug,
              result.settings.collectionImages?.[
                collection.slug
              ] || '',
            ])
          ),
        }));
      }

      setSuccess(
        'Images permanently saved successfully!'
      );
    } catch (err: any) {
      console.error('SAVE ERROR:', err);

      setError(
        err.message ||
          'Failed to save homepage settings'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderImagePreview = (
    image: string,
    type: string
  ) => {
    if (!image) {
      return (
        <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">
          No image uploaded
        </div>
      );
    }

    if (image.startsWith('data:')) {
      return (
        <img
          src={image}
          alt={`${type} preview`}
          className="w-full h-48 object-cover rounded-lg"
        />
      );
    }

    return (
      <img
        src={image}
        alt={`${type} preview`}
        className="w-full h-48 object-cover rounded-lg"
      />
    );
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">

        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">

              <h1 className="text-2xl font-bold text-gray-900">
                Homepage Settings
              </h1>

              <div className="flex items-center gap-4">

                <Link
                  href="/"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  View Website
                </Link>

                <button
                  onClick={() => {
                    localStorage.removeItem(
                      'rangrez_token'
                    );
                    localStorage.removeItem(
                      'rangrez_user'
                    );
                    window.location.href =
                      '/admin/login';
                  }}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Logout
                </button>

              </div>
            </div>
          </div>
        </header>

        {/* Navigation */}
        <nav className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="no-scrollbar -mx-4 flex space-x-6 overflow-x-auto px-4">

              <Link
                href="/admin/dashboard"
                className="flex-none whitespace-nowrap py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
              >
                Dashboard
              </Link>

              <Link
                href="/admin/products"
                className="flex-none whitespace-nowrap py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
              >
                Products
              </Link>

              <Link
                href="/admin/orders"
                className="flex-none whitespace-nowrap py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
              >
                Orders
              </Link>

              <Link
                href="/admin/users"
                className="flex-none whitespace-nowrap py-4 px-2 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
              >
                Users
              </Link>

              <Link
                href="/admin/homepage-settings"
                className="flex-none whitespace-nowrap py-4 px-2 border-b-2 border-gray-900 text-gray-900 font-medium"
              >
                Homepage
              </Link>

            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">

          {isLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">

              <div className="bg-white rounded-lg shadow p-6">

                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Manage Homepage Images
                </h2>

                {error && (
                  <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                  </div>
                )}

                <div className="space-y-8">
                                    {/* Hero Slideshow */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Hero Slideshow
                    </h3>

                    <p className="text-sm text-gray-500 mb-6">
                      Up to three square images for the homepage
                      slideshow. They rotate automatically every
                      3 seconds; empty slots are skipped.
                    </p>

                    <div className="space-y-6">
                      {[
                        { key: 'heroSlide1', label: 'Slide 1' },
                        { key: 'heroSlide2', label: 'Slide 2' },
                        { key: 'heroSlide3', label: 'Slide 3' },
                      ].map((slide) => (
                        <div key={slide.key}>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              {slide.label}
                            </label>

                            {formData[slide.key] && (
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData((prev) => ({
                                    ...prev,
                                    [slide.key]: '',
                                  }))
                                }
                                className="text-sm text-red-600 hover:text-red-700"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          {renderImagePreview(
                            formData[slide.key],
                            slide.label
                          )}

                          <div className="mt-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file =
                                  e.target.files?.[0];

                                if (file) {
                                  handleImageUpload(
                                    slide.key,
                                    file
                                  );
                                }
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Collection Thumbnails */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Collection Thumbnails
                    </h3>

                    <div className="flex items-center justify-between mb-4">
                      <button
                        type="button"
                        onClick={() =>
                          setIsAddingCollection(true)
                        }
                        className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
                      >
                        + Add New Collection
                      </button>
                    </div>

                    {isAddingCollection && (
                      <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Collection Name
                        </label>

                        <div className="flex gap-3">
                          <input
                            type="text"
                            value={newCollectionName}
                            onChange={(e) =>
                              setNewCollectionName(
                                e.target.value
                              )
                            }
                            placeholder="e.g. New Arrivals"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                          />

                          <button
                            type="button"
                            onClick={handleAddCollection}
                            disabled={
                              isCreatingCollection ||
                              !newCollectionName.trim()
                            }
                            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                          >
                            {isCreatingCollection
                              ? 'Adding...'
                              : 'Add'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsAddingCollection(false);
                              setNewCollectionName('');
                            }}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {isCollectionLoading ? (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          Loading collections...
                        </div>
                      ) : collections.length === 0 ? (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          No collections found.
                        </div>
                      ) : (
                        collections.map((collection) => (
                          <div
                            key={collection.id}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            {/* Collection Header */}
                            <div className="flex items-center justify-between mb-3 gap-2">
                              <label className="text-sm font-medium text-gray-700 truncate">
                                {collection.name}
                              </label>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditCollection(
                                      collection
                                    )
                                  }
                                  className="text-xs px-3 py-1.5 rounded-lg font-medium bg-blue-100 text-blue-700 hover:bg-blue-200"
                                >
                                  ✏️ Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDeleteCollection(
                                      collection
                                    )
                                  }
                                  className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-100 text-red-700 hover:bg-red-200"
                                >
                                  🗑️ Delete
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleCollection(
                                      collection
                                    )
                                  }
                                  className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
                                    collection.isVisible
                                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                                  }`}
                                >
                                  {collection.isVisible
                                    ? '👁️ Hide'
                                    : '👁️ Show'}
                                </button>
                              </div>
                            </div>

                            {/* Visibility Status */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-gray-500">
                                Homepage visibility
                              </span>

                              <span
                                className={`text-xs px-2 py-1 rounded-full ${
                                  collection.isVisible
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}
                              >
                                {collection.isVisible
                                  ? 'Shown'
                                  : 'Hidden'}
                              </span>
                            </div>

                            {/* Collection Image */}
                            {renderImagePreview(
                              formData[collection.slug] || '',
                              collection.name
                            )}

                            <div className="mt-2">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file =
                                    e.target.files?.[0];

                                  if (file) {
                                    handleImageUpload(
                                      collection.slug,
                                      file
                                    );
                                  }

                                  e.target.value = '';
                                }}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800"
                              />
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                    <Link
                      href="/admin/dashboard"
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        console.log('SAVE BUTTON CLICKED');
                        handleSubmit();
                      }}
                      disabled={isSaving || isUploading}
                      className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSaving
                        ? 'Saving...'
                        : 'Save Changes'}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          )}
        </main>

        {/* Image Cropper Modal */}
        {imageToCrop && (
          <ImageCropper
            image={imageToCrop.data}
            onCropComplete={(croppedImage) => {
              handleCropComplete(
                croppedImage,
                imageToCrop.type
              );
            }}
            onCancel={() => setImageToCrop(null)}
            aspect={1}
            maxSize={2000}
          />
        )}
      </div>
    </AdminGuard>
  );
} 