import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Heart, Menu, X, Phone, User, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WHATSAPP_NUMBER = '919944550063';

const Navbar = ({ user, cartItemCount, currentView, onNavigate, onLogout }) => {
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

  const handleLinkClick = (e, targetHref, viewOption) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (viewOption) {
      onNavigate(viewOption);
      return;
    }

    if (currentView !== 'landing') {
      onNavigate('landing');
      // Wait for landing view to render then scroll
      setTimeout(() => {
        const target = document.querySelector(targetHref);
        if (target) {
          const navHeight = 80;
          const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
          window.scrollTo({ top: targetPos, behavior: 'smooth' });
        }
      }, 100);
    } else {
      const target = document.querySelector(targetHref);
      if (target) {
        const navHeight = 80;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    }
  };

  const navLinks = [
    { name: 'Home', href: '#', view: 'landing' },
    { name: 'About', href: '#about' },
    { name: 'Products', href: '#products' },
    { name: 'Shop Store', href: '#shop', view: 'shop' },
    { name: 'Quality', href: '#quality' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <nav 
      id="main-navbar"
      role="navigation"
      aria-label="Main navigation"
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled || currentView !== 'landing' ? 'glass-header py-3 shadow-sm' : 'bg-transparent py-5'
      }`}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <a 
            href="#"
            id="navbar-logo"
            className="flex items-center gap-2 focus:outline-none"
            onClick={(e) => handleLinkClick(e, '#', 'landing')}
            aria-label="Gafoor Company - Home"
          >
            <div className="w-10 h-10 bg-grain-green rounded-lg flex items-center justify-center shadow-lg" aria-hidden="true">
              <span className="text-white font-bold text-xl">GC</span>
            </div>
            <div>
              <h1 className="text-xl font-bold transition-colors text-grain-green">
                Gafoor Company
              </h1>
              <p className="text-[8px] uppercase tracking-widest text-grain-gold font-bold">
                Wholesale Prices for Everyone
              </p>
            </div>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8" role="menubar">
            {navLinks.map((link) => (
              <a 
                key={link.name} 
                href={link.href}
                role="menuitem"
                onClick={(e) => handleLinkClick(e, link.href, link.view)}
                className="font-bold text-sm transition-colors relative group focus:outline-none text-gray-700 hover:text-grain-green"
              >
                {link.name}
                <span className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-grain-green transition-all duration-300 group-hover:w-full`} aria-hidden="true"></span>
              </a>
            ))}
          </div>

          {/* Icons & Actions */}
          <div className="flex items-center gap-3">
            
            {/* Cart Icon Button */}
            <button 
              id="navbar-cart-btn"
              onClick={() => onNavigate('cart')}
              className="p-2 rounded-full transition-colors relative hover:bg-grain-green/10 text-gray-700"
              aria-label={`Shopping cart - ${cartItemCount} items`}
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-grain-green text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm" aria-hidden="true">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Auth Condition Button */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hidden md:flex items-center gap-1.5 px-4 py-2.5 rounded-full font-bold text-xs transition-all shadow-sm bg-grain-green text-white hover:bg-grain-green-dark"
                >
                  <User className="w-4 h-4" />
                  <span>Dashboard</span>
                </button>
                
                <button
                  onClick={onLogout}
                  className={`p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors md:flex hidden`}
                  title="Logout"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
            ) : (
              <button 
                id="navbar-login-btn"
                onClick={() => onNavigate('auth')}
                className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-xs transition-all shadow-sm bg-grain-green text-white hover:bg-grain-green-dark"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              id="navbar-mobile-toggle"
              className="lg:hidden p-2 rounded-full transition-colors hover:bg-grain-green/10 text-gray-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 top-[60px] bg-black/40 backdrop-blur-sm"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div 
              id="mobile-menu"
              role="menu"
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
                    href={link.href}
                    role="menuitem"
                    onClick={(e) => handleLinkClick(e, link.href, link.view)}
                    className="text-base font-bold text-gray-700 hover:text-grain-green py-3 px-4 border-b border-gray-50 hover:bg-grain-green/5 rounded-lg transition-all"
                  >
                    {link.name}
                  </a>
                ))}
                
                <div className="pt-4 space-y-2">
                  {user ? (
                    <>
                      <button 
                        onClick={() => { setIsMobileMenuOpen(false); onNavigate('dashboard'); }}
                        className="btn-primary w-full justify-center text-sm font-bold"
                      >
                        <User className="w-4 h-4" /> Go to Dashboard
                      </button>
                      <button 
                        onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                        className="btn-outline w-full justify-center border-red-500 text-red-500 hover:bg-red-50 text-sm font-bold"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => { setIsMobileMenuOpen(false); onNavigate('auth'); }}
                      className="btn-primary w-full justify-center text-sm font-bold"
                    >
                      <User className="w-4 h-4" /> Sign In / Register
                    </button>
                  )}
                  <a 
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hello%2C%20I%20want%20to%20place%20an%20order.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-outline w-full justify-center text-sm font-bold"
                  >
                    Chat on WhatsApp
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
