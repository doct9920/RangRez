'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminGuard from '@/components/AdminGuard';
import Link from 'next/link';
import ImageCropper from '@/components/ImageCropper';
import { shopCategories } from '@/lib/categories';
import { uploadImageToCdn } from '@/lib/upload-client';

export default function NewProductPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
  name: '',
  price: '',
  compareAtPrice: '',
  description: '',
  sku: '',
  collections: [] as string[],
  images: '',
});
const [availableCollections, setAvailableCollections] = useState<
  { id: string; name: string; slug: string }[]
>([]);

useEffect(() => {
  fetch('/api/products/collections')
    .then((res) => res.json())
    .then((data) => setAvailableCollections(data.items || []))
    .catch((err) => console.error('Failed to load collections:', err));
}, []);
  const [colors, setColors] = useState<Array<{ value: string; available: boolean; stock: number }>>([
    { value: '', available: true, stock: 0 },
  ]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  const processFile = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error(`File "${file.name}" is too large. Maximum size is 10MB.`));
        return;
      }

      // Check file type - allow if MIME type is image/* OR if extension suggests it's an image
      const fileName = file.name.toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico'];
      const hasImageExtension = imageExtensions.some(ext => fileName.endsWith(ext));
      const hasImageMimeType = file.type.startsWith('image/');
      
      if (!hasImageMimeType && !hasImageExtension) {
        reject(new Error(`File "${file.name}" is not a recognized image file. Please use JPG, PNG, GIF, or WebP format.`));
        return;
      }

      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (reader.result && typeof reader.result === 'string') {
          // Verify it's actually an image by checking the data URL
          if (!reader.result.startsWith('data:image/')) {
            reject(new Error(`File "${file.name}" could not be read as an image.`));
            return;
          }
          resolve(reader.result);
        } else {
          reject(new Error(`Failed to read file "${file.name}"`));
        }
      };
      
      reader.onerror = (error) => {
        console.error('[Upload] FileReader error:', error);
        reject(new Error(`Error reading file "${file.name}". Please try a different image.`));
      };
      
      reader.onabort = () => {
        reject(new Error(`Reading file "${file.name}" was aborted`));
      };

      try {
        reader.readAsDataURL(file);
      } catch (err: any) {
        console.error('[Upload] Error in readAsDataURL:', err);
        reject(new Error(`Failed to process file "${file.name}": ${err.message || err}`));
      }
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessingUpload(true);
    setError('');

    try {
      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      
      // Validate all files first
      const validationErrors: string[] = [];
      for (const file of fileArray) {
        const fileName = file.name.toLowerCase();
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg', '.ico'];
        const hasImageExtension = imageExtensions.some(ext => fileName.endsWith(ext));
        const hasImageMimeType = file.type.startsWith('image/');
        
        console.log('[Upload] Validating file:', {
          name: file.name,
          type: file.type,
          size: file.size,
          hasExtension: hasImageExtension,
          hasMimeType: hasImageMimeType,
          extension: fileName.substring(fileName.lastIndexOf('.'))
        });
        
        if (!hasImageMimeType && !hasImageExtension) {
          const errorMsg = `"${file.name}" is not a recognized image file. Please ensure the file has an extension (.jpg, .png, .gif, etc.)`;
          validationErrors.push(errorMsg);
          console.warn('[Upload]', errorMsg, { fileType: file.type, fileName: file.name });
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          const errorMsg = `"${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB, max 10MB)`;
          validationErrors.push(errorMsg);
          continue;
        }
        if (file.size === 0) {
          const errorMsg = `"${file.name}" is empty`;
          validationErrors.push(errorMsg);
          continue;
        }
        validFiles.push(file);
      }
      
      // Show all validation errors
      if (validationErrors.length > 0) {
        setError(validationErrors.join('. ') + (validFiles.length > 0 ? ' Other files will be processed.' : ''));
      }

      if (validFiles.length === 0) {
        setError('No valid image files selected');
        setIsProcessingUpload(false);
        return;
      }

      // Process first file and show cropper
      const firstFile = validFiles[0];
      console.log('[Upload] Processing file:', { name: firstFile.name, size: firstFile.size, type: firstFile.type });
      const imageData = await processFile(firstFile);
      console.log('[Upload] Image data received:', { 
        length: imageData.length, 
        isBase64: imageData.startsWith('data:'),
        preview: imageData.substring(0, 50) + '...' 
      });
      setImageToCrop(imageData);
      
      // Store remaining files for processing after cropping
      if (validFiles.length > 1) {
        setPendingFiles(validFiles.slice(1));
      }
    } catch (err: any) {
      console.error('Error processing image:', err);
      setError(err.message || 'Failed to process image. Please try again.');
    } finally {
      setIsProcessingUpload(false);
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setImageToCrop(null);

    // Upload to the CDN and keep the URL: base64 images bloat every page that
    // renders the product.
    uploadImageToCdn(croppedImage, {
      fileName: `product-${Date.now()}`,
      folder: 'products',
    })
      .then((url) => setUploadedImages((prev) => [...prev, url]))
      .catch((err) => setError(err.message || 'Image upload failed'));
    
    // Process next pending file if any
    if (pendingFiles.length > 0) {
      const nextFile = pendingFiles[0];
      setPendingFiles((prev) => prev.slice(1));
      processFile(nextFile)
        .then((imageData) => {
          setImageToCrop(imageData);
        })
        .catch((err) => {
          console.error('Error processing next file:', err);
          setError(err.message || 'Failed to process next image');
          // Continue with remaining files
          if (pendingFiles.length > 1) {
            setPendingFiles((prev) => prev.slice(1));
          }
        });
    }
  };

  const handleCropCancel = () => {
    setImageToCrop(null);
    // Continue with next file if any
    if (pendingFiles.length > 0) {
      const nextFile = pendingFiles[0];
      setPendingFiles((prev) => prev.slice(1));
      processFile(nextFile)
        .then((imageData) => {
          setImageToCrop(imageData);
        })
        .catch((err) => {
          console.error('Error processing next file:', err);
          setError(err.message || 'Failed to process next image');
        });
    }
  };

  const handleRemoveImage = (index: number, isUploaded: boolean) => {
    if (isUploaded) {
      setUploadedImages((prev) => prev.filter((_, i) => i !== index));
    } else {
      setImageUrls((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleAddImageUrl = () => {
    const url = formData.images.trim();
    if (url && (url.startsWith('http://') || url.startsWith('https://')) && !imageUrls.includes(url) && !uploadedImages.includes(url)) {
      setImageUrls((prev) => [...prev, url]);
      setFormData({ ...formData, images: '' });
    } else if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Please enter a valid image URL (must start with http:// or https://)');
    }
  };

  const handleAddColor = () => {
    setColors([...colors, { value: '', available: true, stock: 0 }]);
  };

  const handleRemoveColor = (index: number) => {
    if (colors.length > 1) {
      setColors(colors.filter((_, i) => i !== index));
    }
  };

  const handleColorChange = (index: number, field: 'value' | 'available' | 'stock', value: string | boolean | number) => {
    const updatedColors = [...colors];
    updatedColors[index] = {
      ...updatedColors[index],
      [field]: value,
    };
    setColors(updatedColors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      // Validate colors
      const validColors = colors.filter((color) => color.value.trim() !== '');
      if (validColors.length === 0) {
        throw new Error('At least one color is required');
      }

      // Validate that all colors have valid stock
      for (const color of validColors) {
        if (color.stock < 0) {
          throw new Error(`Stock cannot be negative for color ${color.value}`);
        }
      }

      // Combine uploaded images (base64) and URL images
      const allImages = [...uploadedImages, ...imageUrls];

      if (allImages.length === 0) {
        throw new Error('At least one image is required');
      }

      const token = localStorage.getItem('rangrez_token');
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          price: Number(formData.price),
          compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined,
          description: formData.description,
          sku: formData.sku,
          collections: formData.collections,
images: allImages,
sizes: validColors,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create product');
      }

      const result = await response.json();
      // Redirect to products page
      router.push('/admin/products');
    } catch (err: any) {
      console.error('Error creating product:', err);
      setError(err.message || 'Failed to create product');
      setIsSaving(false);
    }
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Create New Product</h1>
              <div className="flex items-center gap-4">
                <Link
                  href="/admin/products"
                  className="text-gray-600 hover:text-gray-900 transition-colors"
                >
                  ← Back to Products
                </Link>
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
                className="flex-none whitespace-nowrap py-4 px-2 border-b-2 border-gray-900 text-gray-900 font-medium"
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
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <form
              onSubmit={handleSubmit}
              onKeyDown={(event) => {
                // A barcode scanner types the code and then sends Enter, which
                // would otherwise submit this form half-filled. Textareas and
                // the submit button keep their normal behaviour.
                if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') {
                  event.preventDefault();
                }
              }}
              className="bg-white rounded-lg shadow p-8 space-y-6"
            >
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <input
                    id="sku"
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="compareAtPrice" className="block text-sm font-medium text-gray-700 mb-2">
                    Compare At Price (₹)
                  </label>
                  <input
                    id="compareAtPrice"
                    type="number"
                    step="0.01"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    min="0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <div>
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Collections *
  </label>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border border-gray-200 rounded-lg p-4 bg-white">
    {availableCollections.map((collection) => (
      <label
        key={collection.id}
        className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
      >
        <input
          type="checkbox"
          checked={formData.collections.includes(collection.name)}
          onChange={(e) => {
            const updatedCollections = e.target.checked
              ? [...formData.collections, collection.name]
              : formData.collections.filter(
                  (name) => name !== collection.name
                );

            setFormData({
              ...formData,
              collections: updatedCollections,
            });
          }}
          className="h-4 w-4"
        />

        <span className="text-sm font-medium text-gray-800">
          {collection.name}
        </span>
      </label>
    ))}
  </div>

  {formData.collections.length === 0 && (
    <p className="mt-2 text-sm text-red-600">
      कम से कम एक collection चुनें।
    </p>
  )}

  <Link
    href="/admin/collections"
    className="inline-block mt-3 text-sm text-blue-600 hover:underline"
  >
    + Create New Collection
  </Link>
</div>
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Images *
                  </label>
                  
                  {/* Image Upload */}
                  <div className="mb-4">
                    <label
                      htmlFor="image-upload"
                      className={`inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer ${
                        isProcessingUpload ? 'opacity-60 cursor-not-allowed' : ''
                      }`}
                    >
                      {isProcessingUpload ? (
                        <>
                          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Processing...
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          Upload Images from Desktop
                        </>
                      )}
                    </label>
                    <input
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={isProcessingUpload}
                      className="hidden"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Select one or more images from your computer (max 10MB each)
                      {pendingFiles.length > 0 && (
                        <span className="ml-2 text-gray-700 font-medium">
                          • {pendingFiles.length} more image{pendingFiles.length > 1 ? 's' : ''} waiting
                        </span>
                      )}
                    </p>
                  </div>

                  {/* Add Image URL */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.images}
                        onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                        placeholder="Or enter image URL (http:// or https://)"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImageUrl();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddImageUrl}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                  {/* Image Preview */}
                  {(uploadedImages.length > 0 || imageUrls.length > 0) && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      {/* Uploaded Images */}
                      {uploadedImages.map((image, index) => (
                        <div key={`uploaded-${index}`} className="relative group">
                          <img
                            src={image}
                            alt={`Uploaded ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index, true)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      
                      {/* URL Images */}
                      {imageUrls.map((image, index) => (
                        <div key={`url-${index}`} className="relative group">
                          <img
                            src={image}
                            alt={`Image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-gray-300"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12"%3EFailed to load%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index, false)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {uploadedImages.length === 0 && imageUrls.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      No images added. Upload images or add URLs above.
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Product Colors *
                    </label>
                    <button
                      type="button"
                      onClick={handleAddColor}
                      className="text-sm text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Color
                    </button>
                  </div>
                  <div className="space-y-3">
                    {colors.map((color, index) => (
                      <div key={index} className="flex gap-3 items-start p-3 border border-gray-200 rounded-lg bg-gray-50">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Color Name
                          </label>
                          <input
                            type="text"
                            value={color.value}
                            onChange={(e) => handleColorChange(index, 'value', e.target.value)}
                            placeholder="e.g. Maroon"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 text-sm"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Available
                          </label>
                          <select
                            value={color.available ? 'true' : 'false'}
                            onChange={(e) => handleColorChange(index, 'available', e.target.value === 'true')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 text-sm"
                          >
                            <option value="true">Available</option>
                            <option value="false">Not Available</option>
                          </select>
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Stock
                          </label>
                          <input
                            type="number"
                            value={color.stock}
                            onChange={(e) => handleColorChange(index, 'stock', parseInt(e.target.value) || 0)}
                            min="0"
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 text-sm"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveColor(index)}
                          disabled={colors.length === 1}
                          className={`mt-6 p-2 text-red-600 hover:text-red-800 transition-colors ${
                            colors.length === 1 ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Remove color"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Add at least one color with name, availability, and stock quantity
                  </p>
                </div>
              </div>
</div>
              <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
                <Link
                  href="/admin/products"
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors ${
                    isSaving ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  {isSaving ? 'Creating...' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>

      {/* Image Cropper Modal */}
      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
          aspect={1}
          maxSize={2000}
        />
      )}
    </AdminGuard>
  );
}

