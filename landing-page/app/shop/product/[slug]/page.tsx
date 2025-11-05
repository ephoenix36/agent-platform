'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug, getFeaturedProducts } from '@/lib/marketplace-data';
import { Button } from '@/components/ui/Button';

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = getFeaturedProducts(3).filter(p => p.id !== product.id);

  const handleAffiliateClick = () => {
    // Track the click for analytics
    if (typeof window !== 'undefined') {
      const clicks = JSON.parse(localStorage.getItem('affiliate_clicks') || '[]');
      clicks.push({
        productId: product.id,
        timestamp: Date.now(),
        url: product.affiliateUrl,
      });
      localStorage.setItem('affiliate_clicks', JSON.stringify(clicks));
    }
    
    // Open affiliate link
    window.open(product.affiliateUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/shop" className="hover:text-primary-600 transition-colors">
              Shop
            </Link>
            <span>/</span>
            <Link href={`/shop/${product.category}`} className="hover:text-primary-600 transition-colors capitalize">
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Product Header */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Product Image */}
          <div className="bg-white rounded-2xl shadow-md p-8 flex items-center justify-center">
            <div className="w-full aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
              <div className="text-6xl">{product.category === 'productivity' ? '⚡' : product.category === 'health' ? '💪' : product.category === 'learning' ? '📚' : '🌍'}</div>
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium mb-4 capitalize">
              {product.category}
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>
            
            <p className="text-xl text-gray-600 mb-6">
              {product.shortDescription}
            </p>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-gray-600">
                {product.rating} ({product.reviewCount.toLocaleString()} reviews)
              </span>
            </div>

            {/* Price & CTA */}
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-gray-900">
                  ${product.price}
                </span>
                <span className="text-gray-600">
                  · {product.commissionRate}% supports our mission
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                When you purchase through our link, {product.commissionRate}% commission helps fund {product.researchFunding}.
              </p>
              
              <Button
                variant="primary"
                size="lg"
                className="w-full"
                onClick={handleAffiliateClick}
              >
                Get {product.name} →
              </Button>
              
              <p className="text-xs text-gray-500 text-center mt-2">
                Redirects to {product.affiliateProgram}
              </p>
            </div>

            {/* Stock Status */}
            {product.inStock ? (
              <div className="flex items-center gap-2 text-green-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">In Stock</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Currently Out of Stock</span>
              </div>
            )}
          </div>
        </div>

        {/* Product Details */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Why We Love It */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Why We Love It
              </h2>
              <p className="text-gray-700 leading-relaxed">
                {product.longDescription}
              </p>
            </div>

            {/* Key Features */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Key Features
              </h2>
              <ul className="space-y-3">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Honest Assessment */}
            <div className="bg-white rounded-2xl shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Honest Assessment
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* Pros */}
                <div>
                  <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Pros
                  </h3>
                  <ul className="space-y-2">
                    {product.pros.map((pro, index) => (
                      <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        <span>{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Cons */}
                <div>
                  <h3 className="text-lg font-bold text-orange-700 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Cons
                  </h3>
                  <ul className="space-y-2">
                    {product.cons.map((con, index) => (
                      <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                        <span className="text-orange-600 mt-1">•</span>
                        <span>{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Alternatives */}
            {product.alternatives.length > 0 && (
              <div className="bg-white rounded-2xl shadow-md p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Alternatives to Consider
                </h2>
                <p className="text-gray-600 mb-6">
                  We believe in honest recommendations. Here are other options worth considering:
                </p>
                <div className="space-y-4">
                  {product.alternatives.map((alt, index) => (
                    <div key={index} className="border-l-4 border-primary-200 pl-4">
                      <h3 className="font-bold text-gray-900 mb-1">{alt.name}</h3>
                      <p className="text-gray-600 text-sm">{alt.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Who It's For */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Who It's For
              </h3>
              <ul className="space-y-3">
                {product.whoItsFor.map((audience, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700 text-sm">
                    <svg className="w-5 h-5 text-primary-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{audience}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Impact */}
            <div className="bg-gradient-to-br from-primary-50 to-purple-50 rounded-2xl shadow-md p-6 border-2 border-primary-200">
              <div className="text-3xl mb-3">🌍</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Your Purchase Funds Research
              </h3>
              <p className="text-gray-700 text-sm">
                25% of our {product.commissionRate}% commission supports {product.researchFunding}.
              </p>
            </div>

            {/* Trust Signals */}
            <div className="bg-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Our Guarantee
              </h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>We only recommend products we'd use ourselves</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Honest pros and cons included</span>
                </li>
                <li className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>No sponsored placements</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              You Might Also Like
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/shop/product/${relatedProduct.slug}`}
                  className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-5xl">
                      {relatedProduct.category === 'productivity' ? '⚡' : relatedProduct.category === 'health' ? '💪' : relatedProduct.category === 'learning' ? '📚' : '🌍'}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                      {relatedProduct.name}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {relatedProduct.shortDescription}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-bold text-gray-900">
                        ${relatedProduct.price}
                      </span>
                      <span className="text-primary-600 font-medium text-sm group-hover:translate-x-1 transition-transform">
                        View →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
