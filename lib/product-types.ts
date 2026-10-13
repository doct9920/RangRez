export interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  description: string;
  images: string[];
  sizes: Array<{ value: string; available: boolean; stock: number }>;
  inStock: boolean;
  sku: string;
  collection: string;
  collections?: string[];
  searchKeywords?: string[]; // For search functionality
}
