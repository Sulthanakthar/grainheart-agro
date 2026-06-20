import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import ProductShowcase from './components/ProductShowcase';
import QualitySection from './components/QualitySection';
import WholesaleForm from './components/WholesaleForm';
import Footer from './components/Footer';

// New E-Commerce Views
import AuthView from './components/AuthView';
import DealerRegisterView from './components/DealerRegisterView';
import ShopView from './components/ShopView';
import CartView from './components/CartView';
import CheckoutView from './components/CheckoutView';
import DashboardView from './components/DashboardView';

import { MessageCircle } from 'lucide-react';

const apiBaseUrl = import.meta.env.VITE_API_URL || '';

function App() {
  const [view, setView] = useState('landing'); // 'landing' | 'shop' | 'cart' | 'checkout' | 'dashboard' | 'auth' | 'register-dealer'
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [cart, setCart] = useState(null);
  const [wishlist, setWishlist] = useState([]);

  // Seeding trigger helper for when catalogue changes in admin dashboard
  const [catalogUpdateKey, setCatalogUpdateKey] = useState(0);

  // 1. Initial Local Session Loading
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedProfile = localStorage.getItem('profile');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    if (savedProfile) {
      setProfile(JSON.parse(savedProfile));
    }
  }, []);

  // 2. Fetch Cart & Wishlist on Auth
  useEffect(() => {
    if (user) {
      fetchCart();
      fetchWishlist();
    } else {
      setCart(null);
      setWishlist([]);
    }
  }, [user]);

  const getHeaders = useCallback(() => {
    const token = localStorage.getItem('accessToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  const fetchCart = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/cart/`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (err) {
      console.error("Failed to load cart:", err);
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/wishlist/`, {
        headers: getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setWishlist(data.results || data || []);
      }
    } catch (err) {
      console.error("Failed to load wishlist:", err);
    }
  };

  // --- Cart Operation Handlers ---
  const handleAddToCart = async (productId, quantity = 1) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/cart/add-item/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ product: productId, quantity })
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data);
        return true;
      } else {
        const err = await response.json();
        alert(err.error || 'Failed to add item to cart.');
        return false;
      }
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const handleUpdateCartQty = async (productId, quantity) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/cart/update-item/`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ product: productId, quantity })
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveCartItem = async (productId) => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/v1/cart/remove-item/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ product: productId })
      });
      if (response.ok) {
        const data = await response.json();
        setCart(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // --- Wishlist Operation Handlers ---
  const handleToggleWishlist = async (productSlug) => {
    if (!user) {
      alert('Please sign in to save wishlist items!');
      return;
    }
    const isWishlisted = wishlist.some(item => item.product_details?.slug === productSlug || item.product_slug === productSlug);
    try {
      if (isWishlisted) {
        const response = await fetch(`${apiBaseUrl}/api/v1/wishlist/${productSlug}/`, {
          method: 'DELETE',
          headers: getHeaders()
        });
        if (response.ok) {
          fetchWishlist();
        }
      } else {
        // We need product ID. Let's retrieve it from catalog or fetch detail
        const prodRes = await fetch(`${apiBaseUrl}/api/v1/products/${productSlug}/`);
        if (prodRes.ok) {
          const product = await prodRes.json();
          const response = await fetch(`${apiBaseUrl}/api/v1/wishlist/`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ product: product.id })
          });
          if (response.ok) {
            fetchWishlist();
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuthSuccess = (userData, profileData) => {
    setUser(userData);
    setProfile(profileData);
    setView('landing'); // Redirect to home on successful authentication
  };

  const handleLogout = async () => {
    const refresh = localStorage.getItem('refreshToken');
    try {
      if (refresh) {
        await fetch(`${apiBaseUrl}/api/v1/auth/logout/`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({ refresh })
        });
      }
    } catch (err) {
      console.error("Logout request failed:", err);
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('profile');
    setUser(null);
    setProfile(null);
    setView('landing');
  };

  const cartItemCount = cart?.total_items || 0;
  const wishlistSlugs = wishlist.map(item => item.product_details?.slug || item.product_slug).filter(Boolean);

  return (
    <div className="min-h-screen bg-grain-cream selection:bg-grain-green selection:text-white flex flex-col justify-between">
      
      {/* Top Navigation */}
      <Navbar 
        user={user} 
        cartItemCount={cartItemCount} 
        currentView={view} 
        onNavigate={setView} 
        onLogout={handleLogout}
      />
      
      <main className="flex-grow">
        {view === 'landing' && (
          <>
            <Hero />
            <About />
            <ProductShowcase key={catalogUpdateKey} />
            <QualitySection />
            
            {/* Why Choose Us Stats */}
            <section className="py-16 bg-grain-green text-white">
              <div className="container mx-auto px-4 md:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 text-center">
                  {[
                    { label: 'Sortex Quality', val: '100%' },
                    { label: 'Happy Families', val: '10k+' },
                    { label: 'Years Experience', val: '15+' },
                    { label: 'Grain Varieties', val: '50+' },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-2">
                      <h3 className="text-4xl md:text-5xl font-black text-grain-gold">{stat.val}</h3>
                      <p className="text-sm uppercase tracking-widest text-white/70 font-bold">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <WholesaleForm />
          </>
        )}

        {view === 'auth' && (
          <AuthView 
            apiBaseUrl={apiBaseUrl} 
            onAuthSuccess={handleAuthSuccess} 
            onSwitchToDealerRegister={() => setView('register-dealer')}
          />
        )}

        {view === 'register-dealer' && (
          <DealerRegisterView 
            apiBaseUrl={apiBaseUrl} 
            onBackToLogin={() => setView('auth')}
          />
        )}

        {view === 'shop' && (
          <ShopView 
            apiBaseUrl={apiBaseUrl} 
            user={user} 
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            wishlistSlugs={wishlistSlugs}
          />
        )}

        {view === 'cart' && (
          <CartView 
            cart={cart}
            onUpdateCartQty={handleUpdateCartQty}
            onRemoveCartItem={handleRemoveCartItem}
            onCheckout={() => setView('checkout')}
            onBrowseShop={() => setView('shop')}
          />
        )}

        {view === 'checkout' && (
          <CheckoutView 
            cart={cart}
            user={user}
            profile={profile}
            apiBaseUrl={apiBaseUrl}
            onOrderPlaced={() => { fetchCart(); setView('dashboard'); }}
            onBackToCart={() => setView('cart')}
          />
        )}

        {view === 'dashboard' && user && (
          <DashboardView 
            user={user}
            profile={profile}
            apiBaseUrl={apiBaseUrl}
            onLogout={handleLogout}
            onProductChanged={() => setCatalogUpdateKey(prev => prev + 1)}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/919944550063" 
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all animate-bounce hover:animate-none"
        title="Order on WhatsApp"
      >
        <MessageCircle className="w-8 h-8" />
        <span className="absolute -top-2 -left-2 flex h-5 w-5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-5 w-5 bg-white text-[#25D366] text-[10px] font-bold items-center justify-center">1</span>
        </span>
      </a>
    </div>
  );
}

export default App;
