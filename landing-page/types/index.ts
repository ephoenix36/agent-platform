export interface Domain {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: string;
  pricing: number;
  color: string;
  gradient: string;
  useCases: UseCase[];
  outcomes: Outcome[];
  targetMarket: string[];
  stats: DomainStats;
}

export interface UseCase {
  title: string;
  description: string;
  result: string;
}

export interface Outcome {
  metric: string;
  before: string | number;
  after: string | number;
  improvement: string;
}

export interface DomainStats {
  customers: number;
  mrr: number;
  roi: string;
}

export interface ContactFormData {
  name: string;
  email: string;
  company: string;
  domain: string;
  message: string;
  budget?: string;
}

export interface NewsletterFormData {
  email: string;
}

export interface PricingTier {
  domain: string;
  price: number;
  features: string[];
  popular?: boolean;
}

export interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  avatar?: string;
  rating: number;
}

export interface FAQ {
  question: string;
  answer: string;
  category?: string;
}
