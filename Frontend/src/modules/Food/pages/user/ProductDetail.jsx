// old one 



import { useState, useMemo, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import useAppBackNavigation from "@food/hooks/useAppBackNavigation"
import { useLocationGuard } from "@food/hooks/useLocationGuard"

import { ArrowLeft, Star, Clock, MapPin, ShoppingBag, Plus, Minus, Calendar, ThumbsUp, MessageCircle, Send } from "lucide-react"
import AnimatedPage from "@food/components/user/AnimatedPage"
import Footer from "@food/components/user/Footer"
import ScrollReveal from "@food/components/user/ScrollReveal"
import apiClient from "@/services/api/axios"
import { addLineToCart, lineKeyFor, setLineQty } from "@food/utils/userCart"
import { Button } from "@food/components/ui/button"
import { Badge } from "@food/components/ui/badge"

// The product comes from the server (GET /food/products/public/:id, priced for the customer's saved location like
// the menu). The server has no product reviews, restaurant or per-product order data, so the page shows none of them.
const toPageProduct = (p) => {
  if (!p) return null
  const firstSize = (p.sizes || [])[0] || null
  return {
    id: String(p._id || p.id),
    name: p.name || "",
    price: Number(firstSize?.price ?? p.price) || 0,
    size: firstSize?.size || "",
    image: p.image || "",
    description: p.description || p.shortDescription || "",
    category: p.category?.label || "",
    ingredients: (p.toppings || []).map((t) => t.name).filter(Boolean),
    preparationTime: "",
    calories: null,
    rating: 0,
    isVeg: p.vegType !== "non-veg",
  }
}

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const goBack = useAppBackNavigation()
  const checkLocation = useLocationGuard()
  const [product, setProduct] = useState(null)
  const [productLoading, setProductLoading] = useState(true)
  useEffect(() => {
    let cancelled = false
    setProductLoading(true)
    apiClient.get(`/food/products/public/${encodeURIComponent(String(id || ""))}`)
      .then((res) => { if (!cancelled) setProduct(toPageProduct(res?.data?.data)) })
      .catch(() => { if (!cancelled) setProduct(null) })
      .finally(() => { if (!cancelled) setProductLoading(false) })
    return () => { cancelled = true }
  }, [id])

  // The cart is the same one the menu and the cart page use (userCart + pvp_customized_items)
  const cartLine = product ? { itemId: product.id, name: product.name, price: product.price, size: product.size, image: product.image, isVeg: product.isVeg } : null
  const lineKey = cartLine ? lineKeyFor(cartLine) : null
  const [cartQty, setCartQty] = useState(0)
  useEffect(() => {
    const read = () => {
      try {
        const v = JSON.parse(localStorage.getItem("userCart") || "{}")[lineKey]
        setCartQty(typeof v === "object" && v !== null ? Number(v.quantity || 0) : Number(v || 0))
      } catch (_) {
        setCartQty(0)
      }
    }
    read()
    window.addEventListener("cartUpdated", read)
    return () => window.removeEventListener("cartUpdated", read)
  }, [lineKey])
  const isInCart = () => cartQty > 0
  const getCartItem = () => (cartQty > 0 ? { quantity: cartQty } : null)
  const updateQuantity = (_id, qty) => { if (lineKey) setLineQty(lineKey, qty) }
  const [quantity, setQuantity] = useState(1)
  const inCart = product ? isInCart(product.id) : false
  const cartItem = product ? getCartItem(product.id) : null
  const handleAddToCart = () => {
    checkLocation(() => {
      if (product) {
        addLineToCart(cartLine, quantity)
      }
    })
  }

  const handleIncrease = () => {
    if (inCart && cartItem) {
      updateQuantity(product.id, cartItem.quantity + 1)
    } else {
      setQuantity(prev => prev + 1)
    }
  }

  const handleDecrease = () => {
    if (inCart && cartItem) {
      if (cartItem.quantity > 1) {
        updateQuantity(product.id, cartItem.quantity - 1)
      }
    } else {
      setQuantity(prev => Math.max(1, prev - 1))
    }
  }

  if (productLoading) {
    return <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-orange-50/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#0a0a0a]" />
  }

  if (!product) {
    return (
      <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-orange-50/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link to="/user">
            <Button>Go Back Home</Button>
          </Link>
        </div>
      </AnimatedPage>
    )
  }

  return (
    <AnimatedPage className="min-h-screen bg-gradient-to-b from-yellow-50/30 via-white to-orange-50/20 dark:from-[#0a0a0a] dark:via-[#0a0a0a] dark:to-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12">

        {/* Hero Image Section */}
        <div className="relative w-full h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] xl:h-[550px] overflow-hidden rounded-lg md:rounded-xl lg:rounded-2xl mt-4 md:mt-6 lg:mt-8">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover object-center" />

          {/* Back Button - Overlay on Image */}
          <div className="absolute top-4 left-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          {/* Product Info Card Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-[#1a1a1a] rounded-t-3xl p-4 sm:p-5 md:p-6 lg:p-8">
            <div className="flex items-start gap-4 md:gap-6 lg:gap-8">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2 md:mb-3">
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white leading-tight break-words">
                    {product.name}
                  </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg mb-2 md:mb-3 line-clamp-2 lg:line-clamp-3">
                  {product.description}
                </p>
                <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                  {product.category && (
                    <Badge variant="outline" className="text-xs sm:text-sm md:text-base">
                      {product.category}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-[#7e3866]">
                  ₹{Math.round(product.price)}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">per serving</p>
              </div>
            </div>
          </div>
        </div>


        <div className="px-4 sm:px-6 md:px-8 lg:px-10 py-6 sm:py-8 md:py-10 lg:py-12 space-y-6 md:space-y-8 lg:space-y-10">
          {/* Product Info */}
          <ScrollReveal>
            <div className="space-y-4">
              {/* Breadcrumb */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground flex-wrap">
                <Link to="/user" className="hover:text-[#7e3866] transition-colors">Home</Link>
                <span>/</span>
                <span className="text-foreground font-medium truncate">Papa Veg Pizza</span>
                <span>/</span>
                <span className="text-foreground font-medium truncate">{product.name}</span>
              </div>
            </div>
          </ScrollReveal>


          {/* Add to Cart */}
          <ScrollReveal delay={0.3}>
            <div className="space-y-4 pb-4 border-b">
              <h2 className="text-xl font-bold">Order</h2>
              {inCart ? (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border border-[#7e3866] rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 hover:bg-[#F9F9FB]"
                      onClick={handleDecrease}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <span className="px-4 text-lg font-semibold min-w-[2rem] text-center">
                      {cartItem?.quantity || 0}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 hover:bg-[#F9F9FB]"
                      onClick={handleIncrease}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">In cart</p>
                    <p className="text-lg font-bold text-[#7e3866]">
                      ₹{(product.price * (cartItem?.quantity || 0)).toFixed(0)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 border border-gray-300 rounded-lg">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    >
                      <Minus className="h-5 w-5" />
                    </Button>
                    <span className="px-4 text-lg font-semibold min-w-[2rem] text-center">
                      {quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10"
                      onClick={() => setQuantity(prev => prev + 1)}
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>
                  <div
                    className="flex-1"
                  >
                    <Button
                      onClick={handleAddToCart}
                      className="bg-[#7e3866] hover:opacity-90 text-white"
                    >
                      <ShoppingBag className="h-5 w-5 mr-2" />
                      Add to Cart - ₹{(product.price * quantity).toFixed(0)}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>

          {/* Product Details */}
          <ScrollReveal delay={0.2}>
            <div className="space-y-4 md:space-y-6 pb-4 md:pb-6 border-b">
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold">Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-sm md:text-base">
                {product.category && (
                  <div>
                    <p className="text-muted-foreground mb-1 md:mb-2">Category</p>
                    <p className="font-semibold">{product.category}</p>
                  </div>
                )}
                {product.preparationTime && (
                  <div>
                    <p className="text-muted-foreground mb-1 md:mb-2">Preparation Time</p>
                    <p className="font-semibold">{product.preparationTime}</p>
                  </div>
                )}
                {product.calories ? (
                  <div>
                    <p className="text-muted-foreground mb-1 md:mb-2">Calories</p>
                    <p className="font-semibold">{product.calories} kcal</p>
                  </div>
                ) : null}
                {product.ingredients.length > 0 && (
                  <div>
                    <p className="text-muted-foreground mb-1 md:mb-2">Toppings</p>
                    <p className="font-semibold">{product.ingredients.length} items</p>
                  </div>
                )}
              </div>
              {product.ingredients.length > 0 && (
                <div>
                  <p className="text-muted-foreground mb-2 text-sm">Toppings</p>
                  <div className="flex flex-wrap gap-2">
                    {product.ingredients.map((ingredient, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {ingredient}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollReveal>


        </div>
      </div>
      <Footer />
    </AnimatedPage>
  )
}

