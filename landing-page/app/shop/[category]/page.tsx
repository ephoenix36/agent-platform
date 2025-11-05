'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { categories, getProductsByCategory } from '@/lib/marketplace-data';

export default function CategoryPage({ params }: { params: { category: string } }) {
  const category = categories.find(c => c.id === params.category);
  
  if (!category) {
    notFound();
  }

  const products = getProductsByCategory(category.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      {/* Category Header */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-sm text-white/80 mb-6">
            <Link href="/shop" className="hover:text-white transition-colors">
              Shop
            </Link>
            <span>/</span>
            <span className="text-white font-medium">{category.name}</span>
          </nav>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="text-6xl">{category.icon}</div>
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-2">
                {category.name}
              </h1>
              <p className="text-xl text-white/90">
                {category.description}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-white/80">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
            </svg>
            <span>{category.productCount} thoughtfully curated products</span>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/shop/product/${product.slug}`}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Product Image */}
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                <div className="text-6xl">{category.icon}</div>
                
                {/* Rating Badge */}
                <div className="absolute top-4 right-4 bg-white rounded-full px-3 py-1 shadow-md flex items-center gap-1">
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-sm font-medium text-gray-900">{product.rating}</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {product.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                  {product.shortDescription}
                </p>

                {/* Price & CTA */}
                <div className="mt-auto">
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-2xl font-bold text-gray-900">
                      ${product.price}
                    </span>
                    <span className="text-sm text-gray-500">
                      · {product.commissionRate}% funds research
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {product.reviewCount.toLocaleString()} reviews
                    </span>
                    <span className="text-primary-600 font-medium group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      View Details
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* No Products Message */}
        {products.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">{category.icon}</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              More Products Coming Soon
            </h2>
            <p className="text-gray-600 mb-6">
              We're carefully curating products for this category.
            </p>
            <Link href="/shop" className="text-primary-600 font-medium hover:text-primary-700">
              ← Browse All Categories
            </Link>
          </div>
        )}
      </div>

      {/* Category Philosophy */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Our {category.name} Curation Process
          </h2>
          
          <div className="bg-white rounded-2xl shadow-md p-8">
            <p className="text-gray-700 mb-6">
              Every product in this category goes through rigorous testing and evaluation:
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">✅ We Test For:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Real-world effectiveness (weeks/months of use)</li>
                  <li>• Value for money (worth the price?)</li>
                  <li>• Build quality and durability</li>
                  <li>• Customer support and warranty</li>
                  <li>• Comparison to alternatives</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-3">✅ We Prioritize:</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Products we personally use and love</li>
                  <li>• Honest pros AND cons</li>
                  <li>• Sustainable and ethical brands</li>
                  <li>• Long-term value over quick trends</li>
                  <li>• Transparency in recommendations</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
              <p className="text-sm text-gray-700">
                <strong>Impact Promise:</strong> 25% of all commissions from {category.name} products 
                fund breakthrough research in {category.id === 'productivity' ? 'workplace ergonomics and focus' : 
                category.id === 'health' ? 'nutritional science and wellness' : 
                category.id === 'learning' ? 'educational access and literacy' : 
                'climate science and sustainability'}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
