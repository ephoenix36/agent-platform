// Marketplace product type definitions

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: 'productivity' | 'health' | 'learning' | 'impact';
  price: number;
  affiliateUrl: string;
  affiliateProgram: string;
  commissionRate: number;
  image: string;
  shortDescription: string;
  longDescription: string;
  features: string[];
  pros: string[];
  cons: string[];
  alternatives: Array<{
    name: string;
    reason: string;
  }>;
  whoItsFor: string[];
  researchFunding: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
}

export interface ProductCategory {
  id: 'productivity' | 'health' | 'learning' | 'impact';
  name: string;
  description: string;
  icon: string;
  productCount: number;
}

export interface AffiliateClick {
  productId: string;
  timestamp: number;
  referrer?: string;
  userId?: string;
}

export interface MarketplaceAnalytics {
  totalViews: number;
  totalClicks: number;
  conversionRate: number;
  topProducts: Array<{
    productId: string;
    views: number;
    clicks: number;
    conversionRate: number;
  }>;
  topCategories: Array<{
    categoryId: string;
    views: number;
    clicks: number;
  }>;
}
