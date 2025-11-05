'use client';

import { useState } from 'react';

const faqs = [
  {
    category: 'General',
    questions: [
      {
        question: 'What is evolutionary AI optimization?',
        answer: 'Evolutionary algorithms mimic natural selection to find optimal solutions. Our platform generates thousands of strategy variants, tests them, and evolves the best performers—achieving 15-75% improvements over human-designed baseline approaches.',
      },
      {
        question: 'How long until I see results?',
        answer: 'Most clients see measurable improvements within 30-60 days. We run initial optimization cycles, then deploy the best strategies. Our 90-day money-back guarantee ensures you achieve at least 15% improvement.',
      },
      {
        question: 'Do I need technical expertise?',
        answer: 'No. We handle all technical implementation. You provide access to your data and goals, and we deliver optimized strategies + implementation support. Think of it as having an AI optimization team on retainer.',
      },
    ],
  },
  {
    category: 'Pricing & ROI',
    questions: [
      {
        question: 'What\'s included in the monthly fee?',
        answer: 'Unlimited optimization runs, strategy implementation, monthly performance reports, dedicated support, and continuous improvement. No hidden fees or per-use charges.',
      },
      {
        question: 'What\'s the typical ROI?',
        answer: 'ROI varies by domain: Sales (15-20x), Product (10-50x), Education (8-15x), Healthcare (20-100x), Climate (15-30x), Governance (immeasurable). Most clients break even within 30-90 days.',
      },
      {
        question: 'Can I pause or cancel anytime?',
        answer: 'Yes. Monthly subscription with no long-term contract. Cancel anytime. Pause for up to 3 months if needed (no charge during pause).',
      },
    ],
  },
  {
    category: 'Technical',
    questions: [
      {
        question: 'What data do you need?',
        answer: 'Varies by domain. Typically: performance metrics, historical data, constraints, and goals. We work with whatever you have—even limited data. Initial consultation identifies exact requirements.',
      },
      {
        question: 'Is my data secure?',
        answer: 'Absolutely. SOC 2 compliant infrastructure, end-to-end encryption, strict access controls. Data never shared or used for training models. Available to sign NDA/DPA.',
      },
      {
        question: 'Can this integrate with our existing systems?',
        answer: 'Yes. We support API integrations with most platforms (CRMs, ERPs, marketing tools, etc.). Custom integrations available for enterprise clients.',
      },
    ],
  },
  {
    category: 'Philanthropy',
    questions: [
      {
        question: 'Where does the 25% research funding go?',
        answer: '25% of all revenue funds breakthrough research in drug discovery, climate solutions, and theorem proving through AlphaEvolve foundation. You can track impact in quarterly reports.',
      },
      {
        question: 'Can I choose which research to fund?',
        answer: 'Enterprise clients can designate funding towards specific research areas (drug discovery, climate, AI safety, etc.). Individual clients contribute to general research pool.',
      },
    ],
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggleQuestion = (category: string, questionIndex: number) => {
    const key = `${category}-${questionIndex}`;
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <section id="faq" className="py-24 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to know about optimization with evolutionary AI
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-12">
          {faqs.map((category) => (
            <div key={category.category}>
              <h3 className="text-2xl font-bold text-gray-900 mb-6 border-b-2 border-primary-500 pb-2 inline-block">
                {category.category}
              </h3>
              <div className="space-y-4 mt-6">
                {category.questions.map((faq, index) => {
                  const key = `${category.category}-${index}`;
                  const isOpen = openIndex === key;

                  return (
                    <div
                      key={index}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden transition-all hover:shadow-md"
                    >
                      <button
                        className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                        onClick={() => toggleQuestion(category.category, index)}
                        aria-expanded={isOpen}
                      >
                        <span className="font-semibold text-gray-900 text-lg">
                          {faq.question}
                        </span>
                        <svg
                          className={`w-5 h-5 text-primary-600 flex-shrink-0 transition-transform ${
                            isOpen ? 'transform rotate-180' : ''
                          }`}
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-4 text-gray-600 leading-relaxed animate-slide-down">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-white rounded-2xl p-8 border border-gray-200">
          <p className="text-lg text-gray-900 mb-4">
            Still have questions?
          </p>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Contact Us
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
