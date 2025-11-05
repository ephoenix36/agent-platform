import Hero from '@/components/Hero';
import DomainShowcase from '@/components/DomainShowcase';
import PricingTable from '@/components/PricingTable';
import FAQ from '@/components/FAQ';

export default function HomePage() {
  return (
    <>
      <Hero />
      <DomainShowcase />
      <PricingTable />
      <FAQ />
    </>
  );
}
