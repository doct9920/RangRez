// Shared product data - will be replaced with API in future
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

// Use global to persist across hot reloads and sync with admin updates
declare global {
  var __products_store: Record<string, Product> | undefined;
}

// Initialize products - use global if exists, otherwise use default
const defaultProducts: Record<string, Product> = {
  '1': {
    id: '1',
    name: 'Classic White Shirt',
    price: 1999,
    compareAtPrice: 2499,
    description: 'Premium quality white shirt made from 100% cotton. Perfect for formal occasions and business meetings. Features a classic fit with button-down collar.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg', '/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 5 },
      { value: 'M', available: true, stock: 8 },
      { value: 'L', available: true, stock: 3 },
      { value: 'XL', available: false, stock: 0 },
      { value: 'XXL', available: true, stock: 2 },
    ],
    inStock: true,
    sku: 'SHIRT-WH-001',
    collection: 'Shirts',
    searchKeywords: ['shirt', 'white', 'formal', 'cotton', 'classic', 'button-down'],
  },
  '2': {
    id: '2',
    name: 'Navy Blue T-Shirt',
    price: 899,
    compareAtPrice: 1199,
    description: 'Comfortable and stylish navy blue t-shirt. Made from premium cotton blend for all-day comfort. Perfect for casual wear.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 10 },
      { value: 'M', available: true, stock: 15 },
      { value: 'L', available: true, stock: 12 },
      { value: 'XL', available: true, stock: 8 },
    ],
    inStock: true,
    sku: 'TSHIRT-NAV-001',
    collection: 'T-Shirts',
    searchKeywords: ['tshirt', 't-shirt', 'navy', 'blue', 'casual', 'cotton'],
  },
  '3': {
    id: '3',
    name: 'Slim Fit Chinos',
    price: 2499,
    compareAtPrice: 2999,
    description: 'Modern slim-fit chinos in classic khaki. Versatile pants that work for both casual and semi-formal occasions.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [
      { value: '28', available: true, stock: 3 },
      { value: '30', available: true, stock: 5 },
      { value: '32', available: true, stock: 7 },
      { value: '34', available: false, stock: 0 },
      { value: '36', available: true, stock: 2 },
    ],
    inStock: true,
    sku: 'CHINOS-KHA-001',
    collection: 'Pants',
    searchKeywords: ['chinos', 'pants', 'khaki', 'slim', 'fit', 'casual'],
  },
  '4': {
    id: '4',
    name: 'Denim Jacket',
    price: 3499,
    compareAtPrice: 3999,
    description: 'Classic denim jacket with modern fit. Perfect layering piece for any season.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 2 },
      { value: 'M', available: true, stock: 4 },
      { value: 'L', available: true, stock: 3 },
      { value: 'XL', available: true, stock: 1 },
    ],
    inStock: true,
    sku: 'JACKET-DEN-001',
    collection: 'New Arrivals',
    searchKeywords: ['jacket', 'denim', 'jeans', 'outerwear'],
  },
  '5': {
    id: '5',
    name: 'Cotton Polo',
    price: 1299,
    compareAtPrice: 1599,
    description: 'Premium cotton polo shirt. Comfortable and stylish for casual occasions.',
    images: ['/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 6 },
      { value: 'M', available: true, stock: 8 },
      { value: 'L', available: true, stock: 5 },
      { value: 'XL', available: true, stock: 4 },
    ],
    inStock: true,
    sku: 'POLO-COT-001',
    collection: 'T-Shirts',
    searchKeywords: ['polo', 'cotton', 'shirt', 'casual'],
  },
  '6': {
    id: '6',
    name: 'Cargo Pants',
    price: 2199,
    compareAtPrice: 2699,
    description: 'Functional cargo pants with multiple pockets. Durable and comfortable for everyday wear.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [
      { value: '30', available: true, stock: 4 },
      { value: '32', available: true, stock: 6 },
      { value: '34', available: true, stock: 5 },
      { value: '36', available: true, stock: 3 },
    ],
    inStock: true,
    sku: 'CARGO-001',
    collection: 'Pants',
    searchKeywords: ['cargo', 'pants', 'pockets', 'functional'],
  },
  '7': {
    id: '7',
    name: 'Formal White Shirt',
    price: 1999,
    compareAtPrice: 2499,
    description: 'Classic formal white shirt perfect for business and formal occasions.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 7 },
      { value: 'M', available: true, stock: 10 },
      { value: 'L', available: true, stock: 5 },
      { value: 'XL', available: true, stock: 3 },
    ],
    inStock: true,
    sku: 'SHIRT-FORM-001',
    collection: 'Shirts',
    searchKeywords: ['shirt', 'formal', 'white', 'business'],
  },
  '8': {
    id: '8',
    name: 'Casual Check Shirt',
    price: 1799,
    compareAtPrice: 2199,
    description: 'Stylish check pattern shirt for casual occasions.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 4 },
      { value: 'M', available: true, stock: 6 },
      { value: 'L', available: true, stock: 8 },
      { value: 'XL', available: true, stock: 2 },
    ],
    inStock: true,
    sku: 'SHIRT-CHK-001',
    collection: 'Shirts',
    searchKeywords: ['shirt', 'check', 'pattern', 'casual', 'plaid'],
  },
  '9': {
    id: '9',
    name: 'Linen Shirt',
    price: 2299,
    compareAtPrice: 2799,
    description: 'Breathable linen shirt perfect for summer.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 3 },
      { value: 'M', available: true, stock: 5 },
      { value: 'L', available: true, stock: 4 },
      { value: 'XL', available: false, stock: 0 },
    ],
    inStock: true,
    sku: 'SHIRT-LIN-001',
    collection: 'Shirts',
    searchKeywords: ['shirt', 'linen', 'summer', 'breathable'],
  },
  '10': {
    id: '10',
    name: 'Oxford Shirt',
    price: 1899,
    compareAtPrice: 2299,
    description: 'Classic Oxford shirt with button-down collar.',
    images: ['/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 6 },
      { value: 'M', available: true, stock: 9 },
      { value: 'L', available: true, stock: 7 },
      { value: 'XL', available: true, stock: 4 },
    ],
    inStock: true,
    sku: 'SHIRT-OXF-001',
    collection: 'Shirts',
    searchKeywords: ['shirt', 'oxford', 'button-down', 'collar'],
  },
  '11': {
    id: '11',
    name: 'Basic White T-Shirt',
    price: 599,
    compareAtPrice: 799,
    description: 'Essential white t-shirt for everyday wear.',
    images: ['/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 20 },
      { value: 'M', available: true, stock: 25 },
      { value: 'L', available: true, stock: 18 },
      { value: 'XL', available: true, stock: 12 },
    ],
    inStock: true,
    sku: 'TSHIRT-BAS-001',
    collection: 'T-Shirts',
    searchKeywords: ['tshirt', 't-shirt', 'white', 'basic', 'essential'],
  },
  '12': {
    id: '12',
    name: 'Graphic Print T-Shirt',
    price: 899,
    compareAtPrice: 1199,
    description: 'Stylish graphic print t-shirt with unique designs.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 8 },
      { value: 'M', available: true, stock: 12 },
      { value: 'L', available: true, stock: 10 },
      { value: 'XL', available: true, stock: 6 },
    ],
    inStock: true,
    sku: 'TSHIRT-GRP-001',
    collection: 'T-Shirts',
    searchKeywords: ['tshirt', 't-shirt', 'graphic', 'print', 'design'],
  },
  '13': {
    id: '13',
    name: 'V-Neck T-Shirt',
    price: 699,
    compareAtPrice: 899,
    description: 'Comfortable V-neck t-shirt.',
    images: ['/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 15 },
      { value: 'M', available: true, stock: 18 },
      { value: 'L', available: true, stock: 14 },
      { value: 'XL', available: true, stock: 9 },
    ],
    inStock: true,
    sku: 'TSHIRT-V-001',
    collection: 'T-Shirts',
    searchKeywords: ['tshirt', 't-shirt', 'v-neck', 'vneck'],
  },
  '14': {
    id: '14',
    name: 'Polo T-Shirt',
    price: 1299,
    compareAtPrice: 1599,
    description: 'Classic polo t-shirt.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 7 },
      { value: 'M', available: true, stock: 11 },
      { value: 'L', available: true, stock: 9 },
      { value: 'XL', available: true, stock: 5 },
    ],
    inStock: true,
    sku: 'POLO-001',
    collection: 'T-Shirts',
    searchKeywords: ['polo', 'tshirt', 't-shirt'],
  },
  '15': {
    id: '15',
    name: 'Slim Fit Chinos',
    price: 2499,
    compareAtPrice: 2999,
    description: 'Modern slim-fit chinos.',
    images: ['/placeholder-product.jpg'],
    sizes: [
      { value: '28', available: true, stock: 3 },
      { value: '30', available: true, stock: 5 },
      { value: '32', available: true, stock: 7 },
      { value: '34', available: true, stock: 4 },
      { value: '36', available: true, stock: 2 },
    ],
    inStock: true,
    sku: 'CHINOS-SLIM-001',
    collection: 'Pants',
    searchKeywords: ['chinos', 'pants', 'slim', 'fit'],
  },
  '16': {
    id: '16',
    name: 'Cargo Pants',
    price: 2199,
    compareAtPrice: 2699,
    description: 'Functional cargo pants.',
    images: ['/placeholder-product.jpg'],
    sizes: [
      { value: '30', available: true, stock: 4 },
      { value: '32', available: true, stock: 6 },
      { value: '34', available: true, stock: 5 },
      { value: '36', available: true, stock: 3 },
    ],
    inStock: true,
    sku: 'CARGO-002',
    collection: 'Pants',
    searchKeywords: ['cargo', 'pants', 'pockets'],
  },
  '17': {
    id: '17',
    name: 'Formal Trousers',
    price: 2799,
    compareAtPrice: 3299,
    description: 'Classic formal trousers for business wear.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [
      { value: '30', available: true, stock: 2 },
      { value: '32', available: true, stock: 4 },
      { value: '34', available: true, stock: 6 },
      { value: '36', available: true, stock: 3 },
    ],
    inStock: true,
    sku: 'TROUSERS-001',
    collection: 'Pants',
    searchKeywords: ['trousers', 'pants', 'formal', 'business'],
  },
  '18': {
    id: '18',
    name: 'Joggers',
    price: 1899,
    compareAtPrice: 2299,
    description: 'Comfortable joggers for casual wear.',
    images: ['/placeholder-product.jpg'],
    sizes: [
      { value: 'S', available: true, stock: 8 },
      { value: 'M', available: true, stock: 12 },
      { value: 'L', available: true, stock: 10 },
      { value: 'XL', available: true, stock: 6 },
    ],
    inStock: true,
    sku: 'JOGGERS-001',
    collection: 'Pants',
    searchKeywords: ['joggers', 'pants', 'casual', 'comfortable'],
  },
  '19': {
    id: '19',
    name: 'Leather Belt',
    price: 1299,
    compareAtPrice: 1599,
    description: 'Genuine leather belt.',
    images: ['/placeholder-product.jpg'],
    sizes: [
      { value: '32', available: true, stock: 5 },
      { value: '34', available: true, stock: 7 },
      { value: '36', available: true, stock: 4 },
      { value: '38', available: true, stock: 3 },
    ],
    inStock: true,
    sku: 'BELT-LEA-001',
    collection: 'Jackets',
    searchKeywords: ['belt', 'leather', 'jacket'],
  },
  '20': {
    id: '20',
    name: 'Wallet',
    price: 999,
    compareAtPrice: 1299,
    description: 'Premium leather wallet.',
    images: ['/placeholder-product.jpg'],
    sizes: [{ value: 'One Size', available: true, stock: 15 }],
    inStock: true,
    sku: 'WALLET-001',
    collection: 'Jackets',
    searchKeywords: ['wallet', 'leather', 'jacket'],
  },
  '21': {
    id: '21',
    name: 'Sunglasses',
    price: 1999,
    compareAtPrice: 2499,
    description: 'Stylish sunglasses with UV protection.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [{ value: 'One Size', available: true, stock: 10 }],
    inStock: true,
    sku: 'SUNGLASSES-001',
    collection: 'Jackets',
    searchKeywords: ['sunglasses', 'jacket', 'uv', 'protection'],
  },
  '22': {
    id: '22',
    name: 'Watch',
    price: 4999,
    compareAtPrice: 5999,
    description: 'Elegant wristwatch.',
    images: ['/placeholder-product.jpg', '/placeholder-product.jpg'],
    sizes: [{ value: 'One Size', available: true, stock: 4 }],
    inStock: true,
    sku: 'WATCH-001',
    collection: 'Jackets',
    searchKeywords: ['watch', 'wristwatch', 'jacket', 'timepiece'],
  },
};

// Initialize or reuse existing store (persists across hot reloads)
let products: Record<string, Product>;
if (typeof global.__products_store !== 'undefined') {
  products = global.__products_store;
  console.log(`[products.ts] Reusing existing store - Total products: ${Object.keys(products).length}`);
} else {
  products = defaultProducts;
  global.__products_store = products;
  console.log(`[products.ts] Initialized new store - Total products: ${Object.keys(products).length}`);
}

// Export products for backward compatibility
export { products };

// Get all products as array
// Phase 4: Keep sync version for backward compatibility (client-side)
export function getAllProducts(): Product[] {
  // Always read from the global store to get latest updates
  const currentProducts = global.__products_store || products;
  return Object.values(currentProducts);
}

// Get product by ID
// Phase 4: Keep sync version for backward compatibility (client-side)
export function getProductById(id: string): Product | undefined {
  // Always read from the global store to get latest updates
  const currentProducts = global.__products_store || products;
  return currentProducts[id];
}

// Add/Update product (for admin)
export function saveProduct(product: Product): Product {
  const currentProducts = global.__products_store || products;
  currentProducts[product.id] = product;
  global.__products_store = currentProducts; // Ensure global reference is updated
  return product;
}

// Delete product (for admin)
export function deleteProduct(id: string): boolean {
  const currentProducts = global.__products_store || products;
  if (currentProducts[id]) {
    delete currentProducts[id];
    global.__products_store = currentProducts; // Ensure global reference is updated
    return true;
  }
  return false;
}

// Search products
export function searchProducts(query: string, filters?: {
  collection?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
}): Product[] {
  const searchTerm = query.toLowerCase().trim();
  
  // Always read from the global store to get latest updates
  const currentProducts = global.__products_store || products;
  
  if (!searchTerm && !filters) {
    return Object.values(currentProducts);
  }

  let results = Object.values(currentProducts);

  // Text search
  if (searchTerm) {
    results = results.filter((product) => {
      const nameMatch = product.name.toLowerCase().includes(searchTerm);
      const descMatch = product.description.toLowerCase().includes(searchTerm);
      const skuMatch = product.sku.toLowerCase().includes(searchTerm);
      const keywordMatch = product.searchKeywords?.some(keyword => 
        keyword.toLowerCase().includes(searchTerm)
      );
      
      return nameMatch || descMatch || skuMatch || keywordMatch;
    });
  }

  // Apply filters
  if (filters) {
    if (filters.collection) {
      results = results.filter(p => p.collection === filters.collection);
    }
    if (filters.minPrice !== undefined) {
      results = results.filter(p => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      results = results.filter(p => p.price <= filters.maxPrice!);
    }
    if (filters.inStock !== undefined) {
      results = results.filter(p => p.inStock === filters.inStock);
    }
  }

  return results;
}

// Get unique collections
export function getCollections(): string[] {
  const collections = new Set<string>();
  getAllProducts().forEach(product => {
    collections.add(product.collection);
  });
  return Array.from(collections).sort();
}