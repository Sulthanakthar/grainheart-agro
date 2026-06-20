import React, { useState } from 'react';
import { Linkedin, Instagram, Twitter, Youtube, MapPin, Phone, Mail, ArrowUpRight, Send, Facebook } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const navLinks = [
    { name: 'Home', href: '#' },
    { name: 'About Us', href: '#about' },
    { name: 'Our Products', href: '#products' },
    { name: 'Quality Standards', href: '#quality' },
    { name: 'Wholesale Inquiry', href: '#contact' },
    { name: 'Contact Us', href: '#contact' },
  ];

  const products = [
    { name: 'Toor Dal (Sortex)', href: '#products' },
    { name: 'Chana Dal (Premium)', href: '#products' },
    { name: 'Moong Dal (Yellow)', href: '#products' },
    { name: 'Urad Dal (Black)', href: '#products' },
    { name: 'Sharbati Wheat', href: '#products' },
    { name: 'Lokwan Wheat', href: '#products' },
  ];

  const socialLinks = [
    { Icon: Facebook, label: 'Facebook', href: 'https://facebook.com', id: 'footer-facebook-link' },
    { Icon: Instagram, label: 'Instagram', href: 'https://www.instagram.com/gafoor_company?igshid=NzZlODBkYWE4Ng==', id: 'footer-instagram-link' },
    { Icon: Twitter, label: 'Twitter', href: 'https://twitter.com', id: 'footer-twitter-link' },
    { Icon: Youtube, label: 'YouTube', href: 'https://youtube.com', id: 'footer-youtube-link' },
  ];

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim() && email.includes('@')) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const handleSmoothScroll = (e, href) => {
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <footer id="footer" className="bg-gray-900 text-white pt-24 pb-12 overflow-hidden relative">
      {/* Decorative grain pattern */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-grain-green/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" aria-hidden="true"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-grain-gold/5 rounded-full blur-[80px]" aria-hidden="true"></div>
      
      <div className="container mx-auto px-4 md:px-8 relative z-10">
        <div className="grid lg:grid-cols-4 md:grid-cols-2 gap-16 mb-20">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <a href="#" id="footer-logo-link" className="flex items-center gap-3 mb-8 group" aria-label="Gafoor Company home">
              <div className="w-12 h-12 bg-grain-green rounded-xl flex items-center justify-center shadow-lg transform -rotate-6 group-hover:rotate-0 transition-transform duration-300">
                <span className="text-white font-bold text-2xl">GC</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Gafoor Company</h2>
                <p className="text-[8px] uppercase tracking-[0.2em] text-grain-gold font-bold">Wholesale Prices for Everyone</p>
              </div>
            </a>
            <p className="text-gray-400 mb-8 leading-relaxed text-sm">
              Your trusted partner for premium sortex-quality pulses and wheat. 
              Delivering health and freshness to your family since 1990.
            </p>

            {/* Social Links */}
            <div className="flex gap-3 mb-8">
              {socialLinks.map(({ Icon, label, href, id }) => (
                <a 
                  key={id}
                  id={id}
                  href={href} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`Follow us on ${label}`}
                  className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center hover:bg-grain-green transition-all duration-300 group border border-white/5 hover:border-grain-green"
                >
                  <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>

            {/* Newsletter */}
            <div>
              <p className="text-sm font-bold text-white mb-3">Get Wholesale Price Updates</p>
              {subscribed ? (
                <div className="flex items-center gap-2 text-grain-green text-sm font-semibold">
                  <span>✓</span> Subscribed successfully!
                </div>
              ) : (
                <form id="footer-newsletter-form" onSubmit={handleSubscribe} className="flex gap-2">
                  <input 
                    id="footer-email-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-gray-500 focus:border-grain-green focus:bg-white/10 outline-none transition-all"
                  />
                  <button 
                    id="footer-subscribe-btn"
                    type="submit" 
                    className="px-3 py-2.5 rounded-xl bg-grain-green hover:bg-grain-green-dark transition-colors"
                    aria-label="Subscribe to newsletter"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-8 border-l-4 border-grain-gold pl-4">Quick Navigation</h3>
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.name}>
                  <a 
                    href={link.href}
                    id={`footer-link-${link.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                  >
                    <ArrowUpRight className="w-3 h-3 text-grain-gold opacity-0 group-hover:opacity-100 transition-all" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-bold mb-8 border-l-4 border-grain-gold pl-4">Grain Varieties</h3>
            <ul className="space-y-4">
              {products.map((prod) => (
                <li key={prod.name}>
                  <a 
                    href={prod.href}
                    id={`footer-product-${prod.name.toLowerCase().split(' ')[0]}`}
                    onClick={(e) => handleSmoothScroll(e, prod.href)}
                    className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 group text-sm"
                  >
                    <span className="w-1.5 h-1.5 bg-grain-green rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></span>
                    {prod.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-lg font-bold mb-8 border-l-4 border-grain-gold pl-4">Get In Touch</h3>
            <div className="space-y-6">
              <div className="flex gap-4">
                <MapPin className="w-5 h-5 text-grain-gold shrink-0 mt-0.5" aria-hidden="true" />
                <p className="text-gray-400 text-sm leading-relaxed">
                  14, Big Bazaar Street, Tirupattur, Tamil Nadu
                </p>
              </div>
              <div className="flex gap-4">
                <Phone className="w-5 h-5 text-grain-gold shrink-0" aria-hidden="true" />
                <div>
                  <a href="tel:+919944550063" id="footer-phone-link" className="text-white font-bold hover:text-grain-gold transition-colors">
                    +91 99445 50063
                  </a>
                  <p className="text-gray-500 text-[11px] mt-0.5">Mon - Sat: 9AM - 8PM</p>
                </div>
              </div>
              <div className="flex gap-4">
                <Mail className="w-5 h-5 text-grain-gold shrink-0" aria-hidden="true" />
                <a href="mailto:mohammedsulthan2004@gmail.com" id="footer-email-link" className="text-gray-400 text-sm hover:text-white transition-colors">
                  mohammedsulthan2004@gmail.com
                </a>
              </div>

              {/* WhatsApp CTA */}
              <a
                id="footer-whatsapp-cta"
                href="https://wa.me/919944550063?text=Hello%2C%20I%20want%20to%20place%20a%20wholesale%20order."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-5 py-3 rounded-xl bg-[#25D366] text-white font-bold text-sm hover:bg-[#20BA5A] transition-all shadow-lg hover:shadow-xl active:scale-95"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp Order
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm text-center">
            &copy; {currentYear} Gafoor Company. All rights reserved. 
            <span className="mx-2">|</span>
            Wholesale Prices for Everyone.
          </p>
          <div className="flex gap-8 text-xs text-gray-500 font-bold uppercase tracking-widest">
            <a id="footer-privacy-link" href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a id="footer-terms-link" href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a id="footer-refund-link" href="#" className="hover:text-white transition-colors">Refund Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
