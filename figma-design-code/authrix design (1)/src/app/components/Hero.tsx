import { ArrowRight } from 'lucide-react';
import { ProductMockup } from './ProductMockup';

export function Hero() {
  return (
    <section
      className="relative overflow-hidden pt-24 pb-24 px-6 bg-background"
      style={{ fontFamily: 'Inter, sans-serif', minHeight: '100vh' }}
    >
      {/* Single restrained radial — top right only */}
      <div className="absolute pointer-events-none inset-0 overflow-hidden" aria-hidden>
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '560px', height: '480px',
          background: 'radial-gradient(ellipse at 85% 5%, rgba(249,115,22,0.07) 0%, transparent 60%)',
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: '400px', height: '300px',
          background: 'radial-gradient(ellipse at 20% 100%, rgba(249,115,22,0.04) 0%, transparent 60%)',
        }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-20 items-center">

          {/* Left copy — 5 columns */}
          <div className="lg:col-span-5 flex flex-col">

            {/* Eyebrow — monospace, no badge box */}
            <div className="flex items-center gap-2.5 mb-8">
              <div className="size-1.5 rounded-full shrink-0" style={{ background: 'var(--primary)' }} />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Governed operations
              </span>
            </div>

            {/* H1 — large, precise, minimal */}
            <h1
              className="font-semibold text-foreground mb-6"
              style={{ fontSize: 'clamp(2rem, 3.6vw, 3.1rem)', lineHeight: 1.15, letterSpacing: '-0.02em' }}
            >
              Turn engineering signals into{' '}
              <span style={{ color: 'var(--primary)' }}>reviewable</span>{' '}
              operational action.
            </h1>

            {/* Subtext */}
            <p className="text-muted-foreground mb-10 leading-relaxed" style={{ fontSize: '15px', maxWidth: '38ch' }}>
              Authrix turns engineering activity, meeting records, documentation updates, and usage signals into weekly reviews, follow-up work, spend visibility, and approval-gated actions.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-12">
              <a
                href="#demo"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded transition-all duration-150"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Request Early Access
                <ArrowRight className="size-3.5" />
              </a>
              <a
                href="#workflow"
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded border transition-all duration-150 text-muted-foreground hover:text-foreground hover:border-primary/40"
                style={{ border: '1px solid var(--border)' }}
              >
                See how it works
              </a>
            </div>

            {/* Trust markers — horizontal list, no boxing */}
            <div
              className="pt-8"
              style={{ borderTop: '1px solid var(--border)' }}
            >
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
                Designed around
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  'Approval-gated external actions',
                  'Delegated identity via Auth0',
                  'Audit-visible workflows',
                  'Human-in-the-loop execution',
                ].map(tag => (
                  <div key={tag} className="flex items-center gap-2.5 group">
                    <div
                      className="size-1 rounded-full shrink-0 transition-colors duration-200"
                      style={{ background: 'var(--border)' }}
                    />
                    <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-150">
                      {tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right mockup — 7 columns, flat presentation */}
          <div className="lg:col-span-7">
            <div
              className="relative"
              style={{
                transform: 'perspective(1600px) rotateY(-2.5deg) rotateX(1deg)',
                transformOrigin: 'left center',
              }}
            >
              <ProductMockup />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to top, var(--background), transparent)' }}
      />
    </section>
  );
}