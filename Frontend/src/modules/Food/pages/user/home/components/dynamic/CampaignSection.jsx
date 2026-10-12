import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Pizza Card Skeleton ---
export function PizzaCardSkeleton() {
  return (
    <div className="flex-[0_0_calc(85vw-40px)] sm:flex-[0_0_300px] h-[340px] rounded-[24px] bg-gray-200 dark:bg-zinc-800 animate-pulse border border-black/5 dark:border-white/5" />
  );
}

// --- Pizza Card Component ---
export function PizzaCard({ 
  item, 
  cartQuantity = 0, 
  onAdd, 
  onIncrement, 
  onDecrement, 
  onVariantClick 
}) {
  const product = item?.product;
  if (!product) return null;

  const image = item.overrideImage || product.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500";
  const name = product.name;
  const toppings = item.overrideToppingsText || product.shortDescription || product.description || "Delicious premium toppings";
  const isVeg = product.vegType === 'veg' || product.vegType === 'vegan';
  
  const defaultSize = item.defaultVariant?.sizeName || "Regular";
  const defaultCrust = item.defaultVariant?.crustName || "New Hand Tossed";
  
  // Try to find the price based on default size in product.sizes, fallback to product.price
  let price = product.price || 299;
  if (product.sizes && product.sizes.length > 0) {
    const sizeMatch = product.sizes.find(s => s.size.toLowerCase() === defaultSize.toLowerCase());
    if (sizeMatch && sizeMatch.price) price = sizeMatch.price;
  }

  return (
    <div className="flex-[0_0_calc(85vw-40px)] sm:flex-[0_0_300px] h-[340px] rounded-[24px] overflow-hidden relative flex flex-col bg-[#111111] border border-white/10 shadow-xl snap-center transition-transform active:scale-[0.98]">
      
      {/* Top Image Section */}
      <div className="relative h-[200px] w-full flex justify-center items-center overflow-hidden bg-gradient-to-b from-[#2a2a2a] to-[#111111]">
        {/* Glow effect behind pizza */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <div className="w-48 h-48 bg-orange-500/30 rounded-full blur-[50px]"></div>
        </div>
        <img 
          src={image} 
          alt={name} 
          className="relative z-10 w-full h-full object-cover"
          loading="lazy"
        />
        {/* Dark gradient overlay at the bottom to blend image into background */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#111111] to-transparent z-20"></div>
      </div>

      {/* Bottom Content Section */}
      <div className="relative z-30 flex-1 px-4 pb-4 flex flex-col justify-end bg-[#111111]">
        
        {/* Title Row */}
        <div className="flex items-start gap-2 mb-1">
          {/* Veg / Non-Veg Indicator */}
          <div className="mt-[3px] shrink-0 bg-white rounded-sm p-[2px] shadow-sm">
            <div className={`w-[10px] h-[10px] border flex items-center justify-center rounded-[2px] ${isVeg ? 'border-green-700' : 'border-red-700'}`}>
              <div className={`w-[6px] h-[6px] rounded-full ${isVeg ? 'bg-green-700' : 'bg-red-700'}`}></div>
            </div>
          </div>
          <h4 className="text-white font-bold text-[15px] sm:text-[16px] leading-tight font-headline-sm-mobile m-0 line-clamp-1">
            {name}
          </h4>
        </div>

        {/* Toppings Row */}
        <p className="text-white/60 text-[11px] sm:text-[12px] font-medium leading-snug line-clamp-1 mb-4">
          {toppings}
        </p>

        {/* Action Row */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          
          {/* Price & Variant */}
          <div className="flex flex-col">
            <span className="text-white font-bold text-[18px] sm:text-[20px] font-headline-sm-mobile leading-none mb-1">
              ₹{price}
            </span>
            <button 
              onClick={() => onVariantClick(item)}
              className="flex items-center gap-1 text-white/80 hover:text-white text-[10px] sm:text-[11px] font-semibold active:opacity-70 transition-opacity"
            >
              {defaultSize} | {defaultCrust}
              <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            </button>
          </div>

          {/* Add / Stepper Button */}
          <div className="shrink-0 min-w-[72px] flex justify-end">
            <AnimatePresence mode="wait">
              {cartQuantity === 0 ? (
                <motion.button
                  key="add-btn"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={() => onAdd(item)}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold text-[13px] px-5 py-2 rounded-xl shadow-lg active:scale-95 transition-all w-full flex items-center justify-center gap-1"
                >
                  Add <span className="text-[14px] leading-none">+</span>
                </motion.button>
              ) : (
                <motion.div
                  key="stepper"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-red-600 text-white rounded-xl flex items-center justify-between shadow-lg overflow-hidden h-[36px] w-[88px]"
                >
                  <button 
                    onClick={() => onDecrement(item)}
                    className="w-[30px] h-full flex items-center justify-center active:bg-black/20 text-[16px] font-bold"
                  >
                    &minus;
                  </button>
                  <span className="font-bold text-[13px]">{cartQuantity}</span>
                  <button 
                    onClick={() => onIncrement(item)}
                    className="w-[30px] h-full flex items-center justify-center active:bg-black/20 text-[16px] font-bold"
                  >
                    +
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Campaign Header ---
export function CampaignHeader({ campaign }) {
  const { logoImage, heading, tagline, gradientFrom, gradientTo } = campaign;
  
  const defaultFrom = 'rgba(238, 58, 67, 0.1)';
  const defaultTo = 'rgba(238, 58, 67, 0.0)';
  
  const bgGradient = `linear-gradient(to bottom, ${gradientFrom || defaultFrom}, ${gradientTo || defaultTo})`;

  return (
    <div className="flex flex-col items-center justify-center mb-4 pt-4 relative">
      {/* Gradient Tagline Background Strip */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[40px] z-0"
        style={{ background: bgGradient }}
      />
      
      {/* Logo */}
      {logoImage && (
        <div className="relative z-10 w-[140px] h-[50px] mb-2 flex items-center justify-center">
          <img 
            src={logoImage} 
            alt="Campaign Logo" 
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}

      {/* Heading */}
      {heading && (
        <h2 className="relative z-10 text-[22px] sm:text-[24px] font-black text-[#5C3218] dark:text-[#E8D4C8] text-center leading-tight mb-2 font-headline-lg-mobile">
          {heading}
        </h2>
      )}

      {/* Tagline */}
      {tagline && (
        <p className="relative z-10 text-[13px] sm:text-[14px] font-bold text-[#8A4A24] dark:text-[#CBA894] text-center w-full py-2">
          {tagline}
        </p>
      )}
    </div>
  );
}

// --- Campaign Section ---
export function CampaignSection({ 
  campaign, 
  isLoading = false,
  cart = {},
  onAddToCart,
  onIncrement,
  onDecrement,
  onVariantClick
}) {
  if (!isLoading && (!campaign || !campaign.items || campaign.items.length === 0 || !campaign.isActive)) {
    return null; // Hide if inactive or empty
  }

  return (
    <section className="mt-2 mb-6 bg-white dark:bg-[#121212] py-2">
      {isLoading ? (
        <div className="px-margin-mobile flex justify-center py-6">
          <div className="w-[120px] h-[40px] bg-gray-200 dark:bg-zinc-800 animate-pulse rounded-lg" />
        </div>
      ) : (
        <CampaignHeader campaign={campaign} />
      )}

      <div 
        className="flex overflow-x-auto hide-scrollbar px-margin-mobile gap-4 pb-4 pt-2"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {isLoading ? (
          <>
            <PizzaCardSkeleton />
            <PizzaCardSkeleton />
          </>
        ) : (
          campaign.items.map((item) => {
            const productId = item.product?._id || item.product?.id || item.product;
            // Get quantity from cart for this specific product + variant signature. 
            // Since we're using a simplified cart ID format here, we'll just check by productId.
            const qty = cart[productId] || 0;

            return (
              <PizzaCard 
                key={item._id || productId}
                item={item}
                cartQuantity={qty}
                onAdd={onAddToCart}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onVariantClick={onVariantClick}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

