import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Heart, Menu, X, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WHATSAPP_NUMBER = '919876543210';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleSmoothScroll = useCallback((e, href) => {
    if (href === '#') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsMobileMenuOpen(false);
      return;
    }
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      setIsMobileMenuOpen(false);
      const navHeight = 80;
      const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
      window.scrollTo({ top: targetPos, behavior: 'smooth' });
    }
  }, []);

  const navLinks = [
    { name: 'Home', href: '#', id: 'nav-home' },
    { name: 'About', href: '#about', id: 'nav-about' },
    { name: 'Products', href: '#products', id: 'nav-products' },
    { name: 'Quality', href: '#quality', id: 'nav-quality' },
    { name: 'Pricing', href: '#pricing', id: 'nav-pricing' },
    { name: 'Contact', href: '#contact', id: 'nav-contact' },
  ];

  return (
    <nav 
      id="main-navbar"
      role="navigation"
      aria-label="Main navigation"
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'glass-header py-3 shadow-sm' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a 
            href="#"
            id="navbar-logo"
            className="flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-grain-green rounded-lg"
            onClick={(e) => handleSmoothScroll(e, '#')}
            aria-label="Healthy Grains - Home"
          >
            <div className="w-10 h-10 bg-grain-green rounded-lg flex items-center justify-center shadow-lg" aria-hidden="true">
              <span className="text-white font-bold text-xl">HG</span>
            </div>
            <div className="hidden sm:block">
              <h1 className={`text-xl font-bold transition-colors ${isScrolled ? 'text-grain-green' : 'text-white md:text-grain-green'}`}>
                Healthy Grains
              </h1>
              <p className={`text-[10px] uppercase tracking-widest ${isScrolled ? 'text-grain-gold' : 'text-white/80 md:text-grain-gold'}`}>
                Happy Families
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8" role="menubar">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                id={link.id}
                href={link.href}
                role="menuitem"
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className={`font-medium transition-colors relative group focus:outline-none focus:text-grain-green ${
                  isScrolled ? 'text-gray-700 hover:text-grain-green' : 'text-gray-800 hover:text-grain-green'
                }`}
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-grain-green transition-all duration-300 group-hover:w-full" aria-hidden="true"></span>
              </a>
            ))}
          </div>

          {/* Icons & Actions */}
          <div className="flex items-center gap-3">
            {/* Wishlist */}
            <button 
              id="navbar-wishlist-btn"
              className="p-2 hover:bg-grain-green/10 rounded-full transition-colors relative"
              aria-label="Wishlist"
              title="Wishlist"
            >
              <Heart className="w-5 h-5 text-gray-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-grain-gold rounded-full" aria-hidden="true"></span>
            </button>

            {/* Cart */}
            <button 
              id="navbar-cart-btn"
              className="p-2 hover:bg-grain-green/10 rounded-full transition-colors relative"
              aria-label="Shopping cart - 3 items"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-grain-green text-white text-[10px] flex items-center justify-center rounded-full font-bold" aria-hidden="true">3</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              id="navbar-mobile-toggle"
              className="lg:hidden p-2 hover:bg-grain-green/10 rounded-full transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop CTA */}
            <a 
              id="navbar-order-btn"
              href="#contact" 
              onClick={(e) => handleSmoothScroll(e, '#contact')}
              className="hidden md:flex items-center gap-2 bg-grain-green text-white px-5 py-2.5 rounded-full font-semibold hover:bg-grain-green-dark transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span>Order Now</span>
            </a>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 top-[60px] bg-black/20 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-hidden="true"
            />
            <motion.div 
              id="mobile-menu"
              role="menu"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:hidden bg-white border-t border-gray-100 overflow-hidden relative z-10 shadow-xl"
            >
              <div className="container mx-auto px-4 py-6 flex flex-col gap-1">
                {navLinks.map((link) => (
                  <a 
                    key={link.name} 
                    id={`mobile-${link.id}`}
                    href={link.href}
                    role="menuitem"
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className="text-base font-semibold text-gray-700 hover:text-grain-green py-3 px-4 border-b border-gray-50 hover:bg-grain-green/5 rounded-lg transition-all"
                  >
                    {link.name}
                  </a>
                ))}
                <div className="pt-4 space-y-3">
                  <a 
                    id="mobile-whatsapp-btn"
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%2C%20I%20want%20to%20place%20an%20order.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full justify-center"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                    WhatsApp Order
                  </a>
                  <a
                    id="mobile-order-btn"
                    href="#contact"
                    onClick={(e) => handleSmoothScroll(e, '#contact')}
                    className="btn-outline w-full justify-center"
                  >
                    <Phone className="w-4 h-4" aria-hidden="true" />
                    Get Quote
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
