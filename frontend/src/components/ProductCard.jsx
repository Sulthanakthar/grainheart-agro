import React, { useState } from 'react';
import { ShoppingCart, Heart, Eye, Star } from 'lucide-react';
import { motion } from 'framer-motion';

const ProductCard = ({ product }) => {
  const [imgError, setImgError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const fallbackImage = '/images/toor-dal.png';

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="card-premium group relative"
    >
      {/* Product Image Area */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-50">
        <img 
          src={imgError ? fallbackImage : product.image} 
          alt={product.name}
          onError={() => setImgError(true)}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />

        {/* Gradient overlay at bottom for readability */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />

        {/* Badges - top left */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5" aria-label="Product badges">
          {product.isSortex && (
            <span className="bg-grain-green text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
              ✓ Sortex Quality
            </span>
          )}
          {product.discount && (
            <span className="bg-grain-gold text-white text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm">
              🏷 {product.discount}% Off
            </span>
          )}
        </div>

        {/* Wishlist + Quick View - top right, revealed on hover */}
        <div 
          className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-3 group-hover:translate-x-0"
          role="group"
          aria-label="Quick actions"
        >
          <button 
            id={`wishlist-btn-${product.id}`}
            onClick={() => setIsWishlisted(!isWishlisted)}
            className={`p-2 rounded-full shadow-lg transition-all ${
              isWishlisted 
                ? 'bg-red-500 text-white' 
                : 'bg-white hover:bg-grain-green hover:text-white'
            }`}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
            aria-pressed={isWishlisted}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} aria-hidden="true" />
          </button>
          <button 
            id={`quickview-btn-${product.id}`}
            className="p-2 bg-white rounded-full shadow-lg hover:bg-grain-green hover:text-white transition-all"
            aria-label={`Quick view ${product.name}`}
          >
            <Eye className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Add to Cart - slides up on hover */}
        <div className="absolute bottom-0 left-0 w-full px-4 pb-4 translate-y-full group-hover:translate-y-0 transition-all duration-300">
          <button 
            id={`add-to-cart-btn-${product.id}`}
            className="w-full btn-primary py-2.5 text-sm shadow-xl"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="w-4 h-4" aria-hidden="true" />
            Add to Cart
          </button>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Star Ratings */}
        <div className="flex items-center gap-1 mb-2" aria-label="4.8 out of 5 stars">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              className={`w-3 h-3 ${i < 4 ? 'text-grain-gold fill-grain-gold' : 'text-gray-200 fill-gray-200'}`}
              aria-hidden="true"
            />
          ))}
          <span className="text-[10px] text-gray-400 ml-1 font-medium">(4.8)</span>
        </div>

        {/* Category badge - inline */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            {product.category}
          </span>
        </div>
        
        {/* Product Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-grain-green transition-colors leading-tight">
          {product.name}
        </h3>
        
        {/* Description */}
        <p className="text-gray-500 text-sm mb-4 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        {/* Price + Quality tag */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-grain-green" aria-label={`Price: ₹${product.price} per kg`}>
              ₹{product.price}
            </span>
            {product.oldPrice && (
              <span className="text-sm text-gray-400 line-through" aria-label={`Original price: ₹${product.oldPrice}`}>
                ₹{product.oldPrice}
              </span>
            )}
            <span className="text-[10px] text-gray-400 font-medium">/ kg</span>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
            product.quality === 'High Sortex' 
              ? 'bg-purple-100 text-purple-700 border border-purple-200' 
              : product.quality === 'Sortex' 
                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                : 'bg-green-100 text-green-700 border border-green-200'
          }`}>
            {product.quality}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
