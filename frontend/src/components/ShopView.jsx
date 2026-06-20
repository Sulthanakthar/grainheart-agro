import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Heart, Star, ArrowLeft, Send, Check, ShieldAlert, BadgeAlert } from 'lucide-react';

const ShopView = ({ apiBaseUrl, user, onAddToCart, onToggleWishlist, wishlistSlugs }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null); // Detail View mode
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, review: '' });
  const [reviewSubmitLoading, setReviewSubmitLoading] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [toast, setToast] = useState(null);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/v1/categories/`);
        if (response.ok) {
          const data = await response.json();
          setCategories(data.results || data || []);
        }
      } catch (err) {
        console.error("Error loading categories:", err);
      }
    };
    fetchCategories();
  }, [apiBaseUrl]);

  // Fetch products (runs when filters change)
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        let url = `${apiBaseUrl}/api/v1/products/`;
        const params = [];
        if (selectedCategory) params.push(`category=${selectedCategory}`);
        if (selectedQuality) params.push(`quality_grade=${selectedQuality}`);
        if (searchQuery) params.push(`search=${searchQuery}`);
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setProducts(data.results || data || []);
        }
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [apiBaseUrl, selectedCategory, selectedQuality, searchQuery]);

  // Fetch reviews for detail view
  useEffect(() => {
    if (selectedProduct) {
      const fetchReviews = async () => {
        try {
          const response = await fetch(`${apiBaseUrl}/api/v1/products/${selectedProduct.slug}/reviews/`);
          if (response.ok) {
            const data = await response.json();
            setReviews(data);
          }
        } catch (err) {
          console.error("Error loading reviews:", err);
        }
      };
      fetchReviews();
    }
  }, [selectedProduct, apiBaseUrl]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setReviewError('You must be logged in to write a review.');
      return;
    }
    setReviewError('');
    setReviewSubmitLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`${apiBaseUrl}/api/v1/products/${selectedProduct.slug}/reviews/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(reviewForm)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit review. You can only review a product once.');
      }
      setReviews([data, ...reviews]);
      setReviewForm({ rating: 5, review: '' });
      showToast('Review submitted successfully!');
    } catch (err) {
      setReviewError(err.message);
    } finally {
      setReviewSubmitLoading(false);
    }
  };

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const triggerAddToCart = async (product) => {
    if (!user) {
      showToast('Please login to buy products!');
      return;
    }
    const success = await onAddToCart(product.id, 1);
    if (success) {
      showToast(`${product.name} added to cart!`);
    }
  };

  const getQualityText = (product) => {
    return product.quality_grade?.name || 'Standard Quality';
  };

  return (
    <div className="py-28 bg-grain-cream/50 min-h-screen">
      <div className="container mx-auto px-4 md:px-8">
        
        {/* Toast Alert */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-10 right-10 z-50 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border border-grain-gold/30"
            >
              <Check className="w-5 h-5 text-grain-gold" />
              <span className="font-bold text-sm">{toast}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedProduct ? (
          /* PRODUCT DETAIL VIEW */
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 sm:p-12 border border-gray-100">
            <button 
              onClick={() => { setSelectedProduct(null); setReviews([]); setReviewError(''); }}
              className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-grain-green uppercase tracking-widest mb-10 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Catalog
            </button>

            <div className="grid lg:grid-cols-12 gap-12">
              {/* Product Image Gallery */}
              <div className="lg:col-span-5 relative bg-gray-50 rounded-3xl overflow-hidden aspect-[4/3] border border-gray-100 flex items-center justify-center">
                <img 
                  src={selectedProduct.image ? selectedProduct.image : 'images/toor-dal.png'} 
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = 'images/toor-dal.png'; }}
                />
                
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="bg-grain-green text-white text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider shadow-md">
                    {selectedProduct.quality_grade?.name || 'Sortex Grains'}
                  </span>
                </div>
              </div>

              {/* Product Details info */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <span className="text-grain-gold font-bold uppercase tracking-widest text-xs">{selectedProduct.category?.name}</span>
                  <h1 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4 leading-tight">{selectedProduct.name}</h1>
                  
                  {/* Rating summary */}
                  <div className="flex items-center gap-2">
                    <div className="flex text-grain-gold">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-gray-500">({reviews.length} reviews)</span>
                  </div>
                </div>

                <div className="flex items-baseline gap-3 pt-4 border-t border-gray-100">
                  <span className="text-4xl font-black text-grain-green">₹{selectedProduct.price}</span>
                  <span className="text-sm text-gray-400 font-medium">/ kg (VAT incl.)</span>
                  <span className="ml-6 text-sm text-gray-500 font-medium">SKU: <strong className="text-gray-900">{selectedProduct.sku}</strong></span>
                  <span className="ml-4 text-sm text-gray-500 font-medium">Weight: <strong className="text-gray-900">{selectedProduct.weight} kg</strong></span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Available Stock</h3>
                  {selectedProduct.available_stock > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                      <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                      {selectedProduct.available_stock} kg In Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                      Out of Stock
                    </span>
                  )}
                </div>

                <p className="text-gray-600 leading-relaxed text-base pt-2">{selectedProduct.description || selectedProduct.short_description}</p>

                <div className="flex gap-4 pt-6 border-t border-gray-100">
                  <button 
                    onClick={() => triggerAddToCart(selectedProduct)}
                    disabled={selectedProduct.available_stock <= 0}
                    className="flex-1 btn-primary py-4 text-base font-bold shadow-xl shadow-grain-green/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                  </button>
                  <button 
                    onClick={() => onToggleWishlist(selectedProduct.slug)}
                    className={`px-5 py-4 rounded-xl border flex items-center justify-center transition-all ${
                      wishlistSlugs.includes(selectedProduct.slug)
                        ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-500'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${wishlistSlugs.includes(selectedProduct.slug) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* REVIEWS SECTION */}
            <div className="mt-20 pt-12 border-t border-gray-100 grid lg:grid-cols-12 gap-12">
              
              {/* Reviews listing */}
              <div className="lg:col-span-7 space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
                
                {reviews.length === 0 ? (
                  <p className="text-gray-400 italic text-sm">No reviews yet. Be the first to write a review!</p>
                ) : (
                  <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-grain-green text-white font-bold flex items-center justify-center text-xs">
                              {rev.customer_username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-900">{rev.customer_username}</p>
                              <p className="text-[10px] text-gray-400">{new Date(rev.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="flex text-grain-gold">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-gray-200'}`} />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed font-medium">{rev.review}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Review submit form */}
              <div className="lg:col-span-5 bg-gray-50 p-8 rounded-3xl border border-gray-100 h-fit">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Write a Review</h3>
                
                {user ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    {reviewError && (
                      <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-semibold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 shrink-0" />
                        <span>{reviewError}</span>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((stars) => (
                          <button
                            key={stars}
                            type="button"
                            onClick={() => setReviewForm({ ...reviewForm, rating: stars })}
                            className="p-1 text-grain-gold transition-transform hover:scale-125"
                          >
                            <Star className={`w-6 h-6 ${stars <= reviewForm.rating ? 'fill-current' : 'text-gray-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Your Review</label>
                      <textarea
                        required
                        rows="4"
                        placeholder="Share your experience with this product..."
                        value={reviewForm.review}
                        onChange={(e) => setReviewForm({ ...reviewForm, review: e.target.value })}
                        className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm focus:border-grain-green outline-none transition-all resize-none"
                      />
                    </div>

                    <button type="submit" disabled={reviewSubmitLoading} className="btn-primary w-full py-3.5 text-sm font-bold shadow-lg shadow-grain-green/10">
                      {reviewSubmitLoading ? <Loader className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 mb-4 font-semibold">Please log in to submit a rating and review for this product.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          /* PRODUCT CATALOG VIEW */
          <div>
            <div className="text-center mb-16">
              <span className="text-grain-gold font-bold uppercase tracking-widest text-xs">Grain Store</span>
              <h2 className="text-4xl font-extrabold text-gray-900 mt-2 mb-4">Explore Our Grain Collection</h2>
              <div className="h-1.5 bg-grain-gold mx-auto w-16 rounded-full" />
            </div>

            {/* SEARCH AND FILTERS */}
            <div className="grid md:grid-cols-12 gap-4 mb-10 items-center">
              
              {/* Search Bar */}
              <div className="md:col-span-6 relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-gray-400">
                  <Search className="w-5 h-5" />
                </span>
                <input
                  type="text"
                  placeholder="Search products by title, description or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:border-grain-green outline-none transition-all text-sm font-semibold"
                />
              </div>

              {/* Quality Grade Filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedQuality}
                  onChange={(e) => setSelectedQuality(e.target.value)}
                  className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:border-grain-green outline-none transition-all text-sm font-semibold"
                >
                  <option value="">All Quality Grades</option>
                  <option value="1">High Sortex (Premium)</option>
                  <option value="2">Sortex Quality</option>
                  <option value="3">Fine Quality (Regular)</option>
                </select>
              </div>

              {/* Reset Filters */}
              <div className="md:col-span-3">
                <button
                  onClick={() => { setSelectedCategory(''); setSelectedQuality(''); setSearchQuery(''); }}
                  className="w-full btn-outline py-3 text-sm font-bold shadow-sm"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-3 mb-10 justify-center">
              <button
                onClick={() => setSelectedCategory('')}
                className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                  selectedCategory === '' 
                    ? 'bg-grain-green text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-grain-green/5'
                }`}
              >
                All Collections
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ${
                    selectedCategory === cat.slug 
                      ? 'bg-grain-green text-white shadow-md' 
                      : 'bg-white text-gray-600 hover:bg-grain-green/5'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* PRODUCT GRID */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <Loader className="w-12 h-12 text-grain-green animate-spin" />
                <span className="font-bold text-gray-500">Loading catalog...</span>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <p className="text-gray-400 italic font-bold">No products found matching your filter selection.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {products.map((prod) => (
                  <motion.div
                    key={prod.id}
                    layout
                    whileHover={{ y: -8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="card-premium flex flex-col justify-between"
                  >
                    {/* Image block */}
                    <div 
                      onClick={() => setSelectedProduct(prod)}
                      className="relative aspect-[4/3] overflow-hidden bg-gray-50 cursor-pointer"
                    >
                      <img 
                        src={prod.image ? prod.image : 'images/toor-dal.png'} 
                        alt={prod.name}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                        onError={(e) => { e.target.src = 'images/toor-dal.png'; }}
                      />
                      
                      <div className="absolute top-3 left-3">
                        <span className="bg-grain-green text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
                          {getQualityText(prod)}
                        </span>
                      </div>
                    </div>

                    {/* Content Body */}
                    <div className="p-6 flex flex-col justify-between flex-grow">
                      <div className="space-y-2 mb-4">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{prod.category?.name}</span>
                        <h3 
                          onClick={() => setSelectedProduct(prod)}
                          className="text-lg font-bold text-gray-900 hover:text-grain-green cursor-pointer line-clamp-1 transition-colors"
                        >
                          {prod.name}
                        </h3>
                        <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{prod.short_description}</p>
                      </div>

                      <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-black text-grain-green">₹{prod.price}</span>
                          <span className="text-[10px] text-gray-400 ml-1">/ kg</span>
                        </div>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => onToggleWishlist(prod.slug)}
                            className={`p-2 rounded-full border transition-all ${
                              wishlistSlugs.includes(prod.slug)
                                ? 'bg-red-50 text-red-500 border-red-200'
                                : 'border-gray-200 hover:bg-gray-50 text-gray-400'
                            }`}
                            title="Add to Wishlist"
                          >
                            <Heart className={`w-4 h-4 ${wishlistSlugs.includes(prod.slug) ? 'fill-current' : ''}`} />
                          </button>
                          
                          <button
                            onClick={() => triggerAddToCart(prod)}
                            disabled={prod.available_stock <= 0}
                            className="p-2 bg-grain-green text-white rounded-full hover:bg-grain-green-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                            title="Add to Cart"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ShopView;
