import { ThemeProvider } from 'next-themes';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { TrustStrip } from './components/TrustStrip';
import { WorkflowSection } from './components/WorkflowSection';
import { ProductProof } from './components/ProductProof';
import { GovernanceSection } from './components/GovernanceSection';
import { CTASection } from './components/CTASection';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div
        className="bg-background text-foreground min-h-screen overflow-x-hidden"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        <Nav />
        <Hero />
        <TrustStrip />
        <WorkflowSection />
        <ProductProof />
        <GovernanceSection />
        <CTASection />
        <Footer />
      </div>
    </ThemeProvider>
  );
}
