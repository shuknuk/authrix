import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { AuthrixLogo } from './AuthrixLogo';

const NAV_LINKS = [
  { label: 'How it works', href: '#workflow' },
  { label: 'Product',      href: '#product' },
  { label: 'Governance',   href: '#governance' },
  { label: 'Early access', href: '#demo' },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="size-8" />;
  return (
    <button
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      aria-label="Toggle theme"
      className="size-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
    >
      {resolvedTheme === 'dark' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
    </button>
  );
}

export function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith('#')) return;
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      const offset = 56; // nav height
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'color-mix(in srgb, var(--background) 95%, transparent)' : 'var(--background)',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
        fontFamily: 'Inter, sans-serif',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Wordmark */}
        <a href="#" className="flex items-center gap-2.5 shrink-0 group">
          <AuthrixLogo size={26} />
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-px rounded"
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}>
            beta
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center">
          {NAV_LINKS.map(link => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="relative px-4 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 group"
            >
              {link.label}
              {/* underline accent on hover */}
              <span className="absolute bottom-0 left-4 right-4 h-px bg-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
            </a>
          ))}
        </div>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-1">
          <ThemeToggle />
          <a href="#" className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 ml-1">
            Sign in
          </a>
          <a
            href="#demo"
            onClick={(e) => handleNavClick(e, '#demo')}
            className="ml-1 flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded transition-all duration-150"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Request Access
          </a>
        </div>

        {/* Mobile */}
        <div className="flex md:hidden items-center gap-1">
          <ThemeToggle />
          <button
            className="size-8 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-150"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden bg-card border-t border-border">
          <div className="px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(link => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => { handleNavClick(e, link.href); setMenuOpen(false); }}
                className="py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors duration-150 border-b border-border last:border-0"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="px-6 pb-5 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1">Sign in</Button>
            <Button size="sm" className="flex-1">Request Access</Button>
          </div>
        </div>
      )}
    </nav>
  );
}