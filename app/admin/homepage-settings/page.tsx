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

export default function HomepageSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<HomepageSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState<Record<string, string>>({
    heroSlide1: '',
    heroSlide2: '',
    heroSlide3: '',
    ...Object.fromEntries(shopCategories.map((category) => [category.slug, ''])),
  });

  const [imageToCrop, setImageToCrop] = useState<{ type: string; data: string } | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('rangrez_token');
        const response = await fetch('/api/admin/homepage-settings', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch homepage settings');
        }

        const data = await response.json();
        setSettings(data.settings);
        setFormData({
          heroSlide1: data.settings.heroSlides?.[0] || data.settings.heroBannerImage || '',
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

    fetchSettings();
  }, []);

  const processFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error(`File "${file.name}" is too large. Maximum size is 10MB.`));
        return;
      }

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        reject(new Error(`File "${file.name}" is not a recognized image file.`));
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
      reader.onerror = () => reject(new Error(`Error reading file "${file.name}"`));
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (type: string, file: File | null) => {
    if (!file) return;

    try {
      const imageData = await processFile(file);
      setImageToCrop({ type, data: imageData });
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

  shopCategories.forEach((category) => {
    const image = updatedFormData[category.slug];

    if (image && image.trim()) {
      collectionImages[category.slug] = image;
    }
  });

  const heroSlides = [
    updatedFormData.heroSlide1,
    updatedFormData.heroSlide2,
    updatedFormData.heroSlide3,
  ].filter(
    (image): image is string => Boolean(image && image.trim())
  );

  const response = await fetch('/api/admin/homepage-settings', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      heroSlides,
      collectionImages,
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(
      result?.error || `Failed to save image (${response.status})`
    );
  }

  return result.settings;
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
      folder: type.startsWith('heroSlide') ? 'hero' : 'collections',
    });

    // 2. Current form data + new image
    const updatedFormData = {
      ...formData,
      [type]: url,
    };

    // 3. Screen par image show karo
    setFormData(updatedFormData);

    // 4. Database me immediately save karo
    const savedSettings = await saveHomepageSettings(updatedFormData);

    // 5. Database ke saved data ke saath state sync karo
    setSettings(savedSettings);

    setSuccess('Image uploaded and permanently saved!');

    console.log('IMAGE PERMANENTLY SAVED:', {
      type,
      url,
    });

  } catch (err: any) {
    console.error('IMAGE SAVE ERROR:', err);
    setError(err.message || 'Image upload/save failed');
  } finally {
    setIsUploading(false);
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
      throw new Error('Admin session expired. Please login again.');
    }

    const collectionImages: Record<string, string> = {};

    shopCategories.forEach((category) => {
      const image = formData[category.slug];

      if (image && image.trim()) {
        collectionImages[category.slug] = image;
      }
    });

    const heroSlides = [
      formData.heroSlide1,
      formData.heroSlide2,
      formData.heroSlide3,
    ].filter(
      (image): image is string => Boolean(image && image.trim())
    );

    const updateData = {
      heroSlides,
      collectionImages,
    };

    console.log('SAVE START:', updateData);

    const response = await fetch('/api/admin/homepage-settings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updateData),
    });

    const result = await response.json();

    console.log('SAVE RESPONSE:', result);

    if (!response.ok) {
      throw new Error(
        result?.error || `Save failed (${response.status})`
      );
    }

    // Database se jo save hua hai wahi frontend state me rakho
    if (result.settings) {
      setSettings(result.settings);

      setFormData({
        heroSlide1: result.settings.heroSlides?.[0] || '',
        heroSlide2: result.settings.heroSlides?.[1] || '',
        heroSlide3: result.settings.heroSlides?.[2] || '',
        ...Object.fromEntries(
          shopCategories.map((category) => [
            category.slug,
            result.settings.collectionImages?.[category.slug] || '',
          ])
        ),
      });
    }

    setSuccess('Images permanently saved successfully!');

  } catch (err: any) {
    console.error('SAVE ERROR:', err);
    setError(err.message || 'Failed to save homepage settings');
  } finally {
    setIsSaving(false);
  }
};

  const renderImagePreview = (image: string, type: string) => {
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
              <h1 className="text-2xl font-bold text-gray-900">Homepage Settings</h1>
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  View Website
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem('rangrez_token');
                    localStorage.removeItem('rangrez_user');
                    window.location.href = '/admin/login';
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
                      Up to three square images for the homepage slideshow. They
                      rotate automatically every 3 seconds; empty slots are skipped.
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
                                  setFormData((prev) => ({ ...prev, [slide.key]: '' }))
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
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(slide.key, file);
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
                    <p className="text-sm text-gray-500 mb-6">
                      Upload images for each collection category displayed on the homepage.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {shopCategories.map((category) => (
                        <div key={category.slug}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {category.name}
                          </label>
                          {renderImagePreview(formData[category.slug], category.name)}
                          <div className="mt-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleImageUpload(category.slug, file);
                              }}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-900 file:text-white hover:file:bg-gray-800"
                            />
                          </div>
                        </div>
                      ))}
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
  {isSaving ? 'Saving...' : 'Save Changes'}
</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Image Cropper Modal */}
      {imageToCrop && (
        <ImageCropper
          image={imageToCrop.data}
          onCropComplete={(croppedImage) => {
            handleCropComplete(croppedImage, imageToCrop.type);
          }}
          onCancel={() => setImageToCrop(null)}
          aspect={1}
          maxSize={2000}
        />
      )}
    </AdminGuard>
  );
}

