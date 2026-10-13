import type { Product } from './product-types';

// Sort products
export type SortOption = 'relevance' | 'price-low' | 'price-high' | 'name';

export function sortProducts(products: Product[], sortBy: SortOption): Product[] {
  const sorted = [...products];
  
  switch (sortBy) {
    case 'price-low':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price-high':
      return sorted.sort((a, b) => b.price - a.price);
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'relevance':
    default:
      // For now, relevance is just the original order
      // In future, can implement scoring based on match quality
      return sorted;
  }
}

