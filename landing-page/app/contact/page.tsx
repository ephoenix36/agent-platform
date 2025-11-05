import ContactForm from '@/components/ContactForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | Optimization Platform',
  description: 'Get in touch to learn how evolutionary AI can optimize your business operations',
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50/30 py-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Get Started with AI Optimization
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tell us about your optimization goals and we'll design a custom strategy
            to achieve 15-75% improvements in your business metrics
          </p>
        </div>

        {/* Contact Form */}
        <ContactForm />

        {/* Alternative Contact Methods */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Email</h3>
            <a href="mailto:contact@optimization.ai" className="text-primary-600 hover:underline">
              contact@optimization.ai
            </a>
          </div>

          <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Schedule Call</h3>
            <a href="https://cal.com/optimization" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
              Book a Demo
            </a>
          </div>

          <div className="text-center p-6 bg-white rounded-lg border border-gray-200">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Live Chat</h3>
            <button className="text-primary-600 hover:underline">
              Start Chat
            </button>
          </div>
        </div>

        {/* Guarantee */}
        <div className="mt-12 bg-primary-50 border border-primary-200 rounded-lg p-6 text-center">
          <p className="text-gray-700">
            <strong className="text-gray-900">90-Day Money-Back Guarantee:</strong> If we don't achieve at least 15% improvement in your key metrics within 90 days, we'll refund your investment in full.
          </p>
        </div>
      </div>
    </div>
  );
}
