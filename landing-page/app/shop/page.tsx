'use client';

import Link from 'next/link';
import { categories } from '@/lib/marketplace-data';

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Thoughtfully Curated Products
            </h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-8">
              We only recommend products we'd use ourselves.
              <br />
              <strong>25% of commissions fund breakthrough research.</strong>
            </p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Honest Pros & Cons</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No Sponsored Placements</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>25% Funds Research</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Shop by Category
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/shop/${category.id}`}
              className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="p-8">
                <div className="text-5xl mb-4">{category.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                  {category.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {category.description}
                </p>
                <div className="flex items-center text-primary-600 font-medium text-sm">
                  <span>{category.productCount} Products</span>
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              
              {/* Gradient overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-purple-500/0 group-hover:from-primary-500/5 group-hover:to-purple-500/5 transition-all duration-300" />
            </Link>
          ))}
        </div>
      </div>

      {/* Our Curation Philosophy */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Our Curation Philosophy
          </h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 text-center mb-8">
              We're data-driven optimizers who believe in genuine value over hype.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">✅</span>
                  What We Do
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Only recommend products we'd use ourselves</li>
                  <li>• Test products for weeks/months before listing</li>
                  <li>• Include honest pros AND cons</li>
                  <li>• Suggest alternatives (even cheaper ones)</li>
                  <li>• Update recommendations as better options emerge</li>
                </ul>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">❌</span>
                  What We Don't Do
                </h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• Accept sponsored placements</li>
                  <li>• Hide downsides to boost commissions</li>
                  <li>• Recommend products we haven't researched</li>
                  <li>• Use manipulative sales tactics</li>
                  <li>• Prioritize commission over value</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-primary-50 rounded-xl border-2 border-primary-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                🌍 Impact Commitment
              </h3>
              <p className="text-gray-700">
                <strong>25% of all affiliate commissions fund breakthrough research</strong> in 
                optimization, AI safety, climate science, and more. When you buy through our 
                links, you're not just getting a great product—you're funding the future.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
