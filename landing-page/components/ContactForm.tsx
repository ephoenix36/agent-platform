'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, type ContactFormValues } from '@/lib/validations';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { analytics } from '@/lib/analytics';
import { queueEmail, startQueueProcessor, getQueueStatus } from '@/lib/emailQueue';

export default function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error' | 'queued'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  // Start queue processor on mount
  useEffect(() => {
    const cleanup = startQueueProcessor(60000); // Process every minute
    return cleanup;
  }, []);

  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    setErrorMessage('');
    analytics.startContactForm(data.domain);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.status === 429) {
        // Rate limited
        const errorData = await response.json();
        setSubmitStatus('error');
        setErrorMessage(errorData.error || 'Too many requests. Please try again later.');
        analytics.submitContactForm(data.domain, false);
        return;
      }

      if (!response.ok) {
        // Queue email if server error
        queueEmail(data);
        setSubmitStatus('queued');
        analytics.submitContactForm(data.domain, true);
        reset();
        return;
      }

      setSubmitStatus('success');
      analytics.submitContactForm(data.domain, true);
      reset();

      // Reset success message after 5 seconds
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('Form submission error:', error);
      
      // Queue email on network error
      queueEmail(data);
      setSubmitStatus('queued');
      analytics.submitContactForm(data.domain, true);
      reset();
    } finally {
      setIsSubmitting(false);
    }
  };

  const domainOptions = [
    { value: 'sales', label: 'Sales & Marketing Automation' },
    { value: 'product', label: 'Product & Manufacturing' },
    { value: 'education', label: 'Education & Learning' },
    { value: 'healthcare', label: 'Healthcare & Treatment' },
    { value: 'climate', label: 'Climate & Environment' },
    { value: 'governance', label: 'Governance & Policy' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
      {submitStatus === 'success' || submitStatus === 'queued' ? (
        <div className="text-center py-12 animate-fade-in">
          {submitStatus === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h3>
              <p className="text-gray-600 mb-6">
                We've received your inquiry and will respond within 24 hours.
              </p>
            </>
          )}
          {submitStatus === 'queued' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Message Saved!</h3>
              <p className="text-gray-600 mb-6">
                We're experiencing connectivity issues. Your message has been queued and will be sent automatically when service is restored.
              </p>
            </>
          )}
          <Button onClick={() => setSubmitStatus('idle')} variant="outline">
            Submit Another Inquiry
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Your Name"
              {...register('name')}
              error={errors.name?.message}
              placeholder="John Doe"
              required
            />
            <Input
              label="Email Address"
              type="email"
              {...register('email')}
              error={errors.email?.message}
              placeholder="john@company.com"
              required
            />
          </div>

          <Input
            label="Company Name"
            {...register('company')}
            error={errors.company?.message}
            placeholder="Acme Corporation"
            required
          />

          <Select
            label="Interested Domain"
            {...register('domain')}
            error={errors.domain?.message}
            options={domainOptions}
            required
          />

          <div>
            <label
              htmlFor="message"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              id="message"
              {...register('message')}
              rows={5}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Tell us about your optimization goals and current challenges..."
            />
            {errors.message && (
              <p className="mt-2 text-sm text-red-600">{errors.message.message}</p>
            )}
          </div>

          <Input
            label="Monthly Budget (Optional)"
            {...register('budget')}
            error={errors.budget?.message}
            placeholder="e.g., $5,000-$10,000"
          />

          {/* Honeypot field - hidden from real users */}
          <input
            type="text"
            {...register('website')}
            style={{ position: 'absolute', left: '-9999px' }}
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {submitStatus === 'error' && errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p className="font-semibold">Submission failed.</p>
              <p className="text-sm mt-1">
                {errorMessage}
              </p>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Send Inquiry'}
          </Button>

          <p className="text-sm text-gray-500 text-center">
            We typically respond within 24 hours. Your information is secure and never shared.
          </p>
        </form>
      )}
    </div>
  );
}
