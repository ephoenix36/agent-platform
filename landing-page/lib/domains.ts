import type { Domain } from '@/types';

export const domains: Domain[] = [
  {
    id: 'sales',
    name: 'Sales',
    title: 'Sales & Marketing Automation',
    description: 'AI-powered prospect research, email validation, and response classification for B2B sales teams',
    icon: '📊',
    pricing: 2500,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    targetMarket: ['B2B SaaS', 'Enterprise Sales', 'Sales Development Teams'],
    useCases: [
      {
        title: 'LinkedIn Prospect Research',
        description: 'Automatically research prospects and generate personalized outreach',
        result: '15-20x more meetings booked',
      },
      {
        title: 'Email Deliverability Validation',
        description: 'Validate emails before sending to improve inbox rates',
        result: '96%+ deliverability achieved',
      },
      {
        title: 'Reply Classification',
        description: 'Automatically categorize and route responses',
        result: '3.5% response rate (vs 2% baseline)',
      },
    ],
    outcomes: [
      { metric: 'Meetings Booked', before: '10/month', after: '180/month', improvement: '+1700%' },
      { metric: 'Response Rate', before: '2.0%', after: '3.5%', improvement: '+75%' },
      { metric: 'Time Saved', before: '0', after: '120 hrs/month', improvement: '100%' },
    ],
    stats: {
      customers: 40,
      mrr: 100000,
      roi: '15-20x',
    },
  },
  {
    id: 'product',
    name: 'Product',
    title: 'Product & Manufacturing Optimization',
    description: 'Optimize UI/UX flows, supply chains, and manufacturing processes for maximum efficiency',
    icon: '🎯',
    pricing: 5000,
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    targetMarket: ['E-commerce', 'SaaS Companies', 'Manufacturers'],
    useCases: [
      {
        title: 'Checkout Optimization',
        description: 'Evolve checkout flows to maximize conversion',
        result: '58% → 79% conversion (+36%)',
      },
      {
        title: 'Supply Chain Efficiency',
        description: 'Optimize supplier selection and inventory levels',
        result: '$12.5M → $10.2M cost (-18%)',
      },
      {
        title: 'Manufacturing Throughput',
        description: 'Tune production processes for quality and speed',
        result: '850 → 1,020 units/day (+20%)',
      },
    ],
    outcomes: [
      { metric: 'Checkout Conversion', before: '58%', after: '79%', improvement: '+36%' },
      { metric: 'Supply Chain Cost', before: '$12.5M', after: '$10.2M', improvement: '-18%' },
      { metric: 'Production Throughput', before: '850/day', after: '1020/day', improvement: '+20%' },
    ],
    stats: {
      customers: 20,
      mrr: 100000,
      roi: '10-50x',
    },
  },
  {
    id: 'education',
    name: 'Education',
    title: 'Education & Learning Optimization',
    description: 'Design optimal curricula, personalized learning paths, and assessment strategies',
    icon: '📚',
    pricing: 8000,
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    targetMarket: ['Schools', 'Universities', 'EdTech', 'Corporate Training'],
    useCases: [
      {
        title: 'Curriculum Optimization',
        description: 'Sequence topics for maximum retention using learning science',
        result: '48% → 73% 3-month retention (+52%)',
      },
      {
        title: 'Personalized Learning Paths',
        description: 'Adapt content to individual student needs and pace',
        result: '35% → 18% drop-out rate (-49%)',
      },
      {
        title: 'Assessment Strategy',
        description: 'Optimize quiz timing and format for learning + measurement',
        result: '0.72 → 0.84 measurement accuracy (+17%)',
      },
    ],
    outcomes: [
      { metric: '3-Month Retention', before: '48%', after: '73%', improvement: '+52%' },
      { metric: 'Drop-out Rate', before: '35%', after: '18%', improvement: '-49%' },
      { metric: 'Student Satisfaction', before: '7.2/10', after: '8.7/10', improvement: '+21%' },
    ],
    stats: {
      customers: 10,
      mrr: 80000,
      roi: '8-15x',
    },
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    title: 'Healthcare & Treatment Optimization',
    description: 'Optimize treatment protocols, care pathways, and clinical workflows for better outcomes',
    icon: '⚕️',
    pricing: 8000,
    color: 'red',
    gradient: 'from-red-500 to-orange-500',
    targetMarket: ['Hospitals', 'Health Systems', 'Clinics', 'Digital Health'],
    useCases: [
      {
        title: 'Sepsis Treatment Protocol',
        description: 'Optimize antibiotic timing and selection',
        result: '28% → 19% mortality (-32%)',
      },
      {
        title: 'Heart Failure Care Pathway',
        description: 'Design optimal patient journey from admission to discharge',
        result: '24% → 15% readmissions (-38%)',
      },
      {
        title: 'ED Workflow Optimization',
        description: 'Reduce wait times and improve throughput',
        result: '68min → 22min door-to-provider (-68%)',
      },
    ],
    outcomes: [
      { metric: 'Sepsis Mortality', before: '28%', after: '19%', improvement: '-32%' },
      { metric: 'HF Readmissions', before: '24%', after: '15%', improvement: '-38%' },
      { metric: 'ED Wait Time', before: '68 min', after: '22 min', improvement: '-68%' },
    ],
    stats: {
      customers: 10,
      mrr: 80000,
      roi: '20-100x',
    },
  },
  {
    id: 'climate',
    name: 'Climate',
    title: 'Climate & Environment Optimization',
    description: 'Optimize carbon capture, renewable energy systems, and sustainable agriculture',
    icon: '🌍',
    pricing: 10000,
    color: 'teal',
    gradient: 'from-teal-500 to-cyan-500',
    targetMarket: ['Carbon Capture', 'Renewable Energy', 'Agriculture', 'Sustainability'],
    useCases: [
      {
        title: 'Carbon Capture Efficiency',
        description: 'Optimize DAC system parameters for maximum CO2 removal',
        result: '68% → 80% capture efficiency (+18%)',
      },
      {
        title: 'Wind Farm Optimization',
        description: 'Optimize turbine placement and yaw control',
        result: '32% → 35.5% capacity factor (+11%)',
      },
      {
        title: 'Precision Agriculture',
        description: 'Optimize irrigation, fertilization, and planting schedules',
        result: '+28% yield, -25% water usage',
      },
    ],
    outcomes: [
      { metric: 'Carbon Capture Efficiency', before: '68%', after: '80%', improvement: '+18%' },
      { metric: 'Wind Capacity Factor', before: '32%', after: '35.5%', improvement: '+11%' },
      { metric: 'Crop Yield', before: 'baseline', after: '+28%', improvement: '+28%' },
    ],
    stats: {
      customers: 20,
      mrr: 200000,
      roi: '15-30x',
    },
  },
  {
    id: 'governance',
    name: 'Governance',
    title: 'Governance & Policy Optimization',
    description: 'Simulate and optimize government policies, voting systems, and resource allocation',
    icon: '⚖️',
    pricing: 15000,
    color: 'indigo',
    gradient: 'from-indigo-500 to-purple-500',
    targetMarket: ['Government Agencies', 'Think Tanks', 'NGOs', 'Policy Institutes'],
    useCases: [
      {
        title: 'Voting System Design',
        description: 'Optimize electoral systems for fairness and representation',
        result: '68% → 89% Condorcet efficiency (+31%)',
      },
      {
        title: 'City Budget Allocation',
        description: 'Maximize citizen well-being per dollar spent',
        result: '6.2 → 7.1 satisfaction score (+14%)',
      },
      {
        title: 'UBI Policy Design',
        description: 'Balance poverty reduction with work incentives',
        result: '11% → 4% poverty rate (-64%)',
      },
    ],
    outcomes: [
      { metric: 'Voting Fairness', before: '68%', after: '89%', improvement: '+31%' },
      { metric: 'Citizen Satisfaction', before: '6.2/10', after: '7.1/10', improvement: '+14%' },
      { metric: 'Poverty Rate', before: '11%', after: '4%', improvement: '-64%' },
    ],
    stats: {
      customers: 5,
      mrr: 75000,
      roi: 'Immeasurable',
    },
  },
];

export function getDomainById(id: string): Domain | undefined {
  return domains.find(d => d.id === id);
}

export function getDomainsByCategory(category: string): Domain[] {
  // Future: add category filtering
  return domains;
}
