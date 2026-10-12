import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, Search, ArrowUpDown, Check, X, Star } from "lucide-react"
import apiClient from "@/services/api/axios"
import DeliveryMapModal from "@food/components/user/DeliveryMapModal"
import DeliveryOrCollectionModal from "@food/components/user/DeliveryOrCollectionModal"
import { useLocationStore } from "@food/store/locationStore"
import { useLocationGuard } from "@food/hooks/useLocationGuard"
import logoNew from "@/assets/logo1.png"

const MENU_ITEMS = {
  slices: [
    {
      id: "slice-margherita",
      title: "Cheesy Classic Slice",
      price: 99,
      badge: "NEW",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
      description: "Generous single jumbo slice overloaded with gooey mozzarella and herb seasoned tomato sauce.",
      sizes: ["Jumbo Single Slice", "Double Slice Box"],
      rating: 4.8,
      ratingCount: 38
    },
    {
      id: "slice-paneer-tikka",
      title: "Spicy Paneer Tikka Slice",
      price: 129,
      badge: "NEW",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80",
      description: "Jumbo slice topped with smoky tandoori paneer, crisp bell peppers, and chipotle drizzle.",
      sizes: ["Jumbo Single Slice", "Double Slice Box"],
      rating: 4.9,
      ratingCount: 42
    }
  ],
  "cheese-burst": [
    {
      id: "cb-farmhouse",
      title: "2in1 Cheese Burst Farmhouse",
      price: 389,
      badge: "NEW",
      image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&auto=format&fit=crop&q=80",
      description: "Double the cheese with a molten cheese-filled crust and golden liquid cheese topping.",
      sizes: ["Regular", "Medium", "Large"],
      rating: 4.9,
      ratingCount: 56
    }
  ],
  "big-big-pizza": [
    {
      id: "big-overload",
      title: "Big Big Veggie Overload",
      price: 499,
      badge: "New Flavours",
      image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=80",
      description: "Giant 14-inch party-sized pizza loaded edge-to-edge with farm fresh veggies and creamy mozzarella.",
      sizes: ["14in Jumbo Party"],
      rating: 4.7,
      ratingCount: 29
    }
  ],
  "party-combo": [
    {
      id: "combo-party-feast",
      title: "Ultimate Party Combo Feast",
      price: 799,
      badge: "UPTO ₹1000 OFF",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80",
      description: "2 Medium Pizzas + 1 Garlic Bread Stix + 1 Choco Volcano Cake + 1.25L Pepsi.",
      sizes: ["Party Pack for 4-5"],
      rating: 4.9,
      ratingCount: 64
    }
  ],
  pizzas: [
    {
      id: "fiery-schezwan",
      title: "Fiery Schezwan Veggie",
      price: 299,
      badge: "NEW",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
      description: "Fiery schezwan sauce, dynamic mozzarella, onions, sweet bell peppers, and fresh greens.",
      sizes: ["Oval 10in Crafted Flatz", "Personal Pan", "Medium Hand Tossed", "Large Stuffed Crust"],
      rating: 4.3,
      ratingCount: 19
    },
    {
      id: "smokey-bbq",
      title: "Smokey BBQ Veggie",
      price: 299,
      badge: "NEW",
      image: "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&auto=format&fit=crop&q=80",
      description: "Rich smokey BBQ base, melted mozzarella, loaded red onions, golden sweet corn, and BBQ drizzle.",
      sizes: ["Oval 10in Crafted Flatz", "Personal Pan", "Medium Hand Tossed", "Large Stuffed Crust"],
      rating: 4.5,
      ratingCount: 22
    },
    {
      id: "paneer-makhni",
      title: "Paneer Makhni Masala",
      price: 299,
      badge: "NEW",
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=80",
      description: "Indian style Makhni sauce, premium marinated paneer cubes, capsicum, red onions, and tomatoes.",
      sizes: ["Oval 10in Crafted Flatz", "Personal Pan", "Medium Hand Tossed", "Large Stuffed Crust"],
      rating: 4.7,
      ratingCount: 35
    },
    {
      id: "overloaded-veggies",
      title: "Overloaded Veggies",
      price: 299,
      badge: "NEW",
      image: "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=80",
      description: "Black olives, mushrooms, sweet corn, red onions, tri-color bell peppers, and jalapeños.",
      sizes: ["Oval 10in Crafted Flatz", "Personal Pan", "Medium Hand Tossed", "Large Stuffed Crust"],
      rating: 4.4,
      ratingCount: 18
    }
  ],
  burgers: [
    {
      id: "crispy-veg-burger",
      title: "Crispy Veg Burger",
      price: 149,
      image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&auto=format&fit=crop&q=80",
      description: "Crispy mixed vegetable patty, fresh lettuce, tomatoes, and creamy classic mayonnaise.",
      rating: 4.1,
      ratingCount: 15
    },
    {
      id: "spicy-paneer-burger",
      title: "Spicy Paneer Burger",
      price: 189,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80",
      description: "Spicy marinated paneer patty, layered with spicy dressing, melted cheese, and sliced onions.",
      rating: 4.6,
      ratingCount: 28
    }
  ],
  breads: [
    {
      id: "garlic-bread-stix",
      title: "Garlic Bread Stix",
      price: 119,
      image: "https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=500&auto=format&fit=crop&q=80",
      description: "Freshly baked garlic bread sticks served warm with creamy dynamic dipping sauce.",
      rating: 4.2,
      ratingCount: 12
    },
    {
      id: "cheese-garlic-bread",
      title: "Cheese Garlic Bread",
      price: 149,
      image: "https://images.unsplash.com/photo-1574085733277-851d9d856a3a?w=500&auto=format&fit=crop&q=80",
      description: "Toasted thick bread slices loaded with garlic butter, fresh parsley, and gooey melted mozzarella.",
      rating: 4.5,
      ratingCount: 19
    }
  ],
  pasta: [
    {
      id: "creamy-mushroom-penne",
      title: "Creamy Mushroom Penne",
      price: 249,
      image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=500&auto=format&fit=crop&q=80",
      description: "Penne tossed in a rich, creamy white parmesan sauce loaded with fresh button mushrooms and garlic herbs.",
      rating: 4.3,
      ratingCount: 14
    },
    {
      id: "spiced-arrabbiata",
      title: "Spiced Arrabbiata Pasta",
      price: 229,
      image: "https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=500&auto=format&fit=crop&q=80",
      description: "Penne pasta in a fiery, spiced San Marzano tomato sauce infused with fresh garlic, chili flakes, and basil leaves.",
      rating: 4.4,
      ratingCount: 21
    }
  ],
  desserts: [
    {
      id: "warm-brownie",
      title: "Warm Chocolate Brownie",
      price: 129,
      image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500&auto=format&fit=crop&q=80",
      description: "Rich, dense chocolate brownie served warm with a shiny, gooey dark chocolate glaze on top.",
      rating: 4.8,
      ratingCount: 42
    },
    {
      id: "choco-volcano",
      title: "Choco Volcano Cake",
      price: 139,
      image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80",
      description: "Freshly baked soft chocolate sponge cake with a molten, oozing chocolate lava core inside.",
      rating: 4.9,
      ratingCount: 50
    }
  ],
  drinks: [
    {
      id: "water-bottle",
      title: "Purified Water Bottle",
      price: 40,
      image: "/food/bisleri_water_bottle.png",
      description: "Ice-cold premium mineral packaged drinking water for refreshment.",
      rating: 4.0,
      ratingCount: 5
    },
    {
      id: "pepsi-cola",
      title: "Pepsi Cola (500ml)",
      price: 60,
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=80",
      description: "500ml bottle of cold, sparkling carbonated Pepsi cola beverage.",
      rating: 4.3,
      ratingCount: 8
    }
  ]
}

export default function MenuList() {
  const navigate = useNavigate()
  const { isModalOpen, closeLocationModal, confirmLocation, locationConfirmed } = useLocationStore()
  const checkLocation = useLocationGuard()
  const location = useLocation()
  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : false
  })

  // Dynamic Logo State
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("sa_logo") || logoNew);
  useEffect(() => {
    const handleBrandingSync = () => {
      setLogoUrl(localStorage.getItem("sa_logo") || logoNew);
    };
    window.addEventListener("systemThemeChanged", handleBrandingSync);
    return () => window.removeEventListener("systemThemeChanged", handleBrandingSync);
  }, []);

  // Helper to strictly sort categories according to superadmin configuration
  const sortCategoriesBySuperadmin = (list) => {
    return [...list].sort((a, b) => {
      const aVal = Number(a.sort !== undefined && a.sort !== null ? a.sort : 0);
      const bVal = Number(b.sort !== undefined && b.sort !== null ? b.sort : 0);
      // If both have positive rank, sort ascending (1, 2, 3...)
      if (aVal > 0 && bVal > 0) return aVal - bVal;
      // Ranked items (sort > 0) come before unranked/0
      if (aVal > 0 && bVal <= 0) return -1;
      if (bVal > 0 && aVal <= 0) return 1;
      // If both have the same rank (or 0), preserve createdAt ascending
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return 0;
    });
  };

  // Dynamic Categories State
  const [categories, setCategories] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_categories");
      if (stored) {
        const parsed = JSON.parse(stored).filter(c => c.status !== "Inactive");
        if (parsed.length > 0) {
          const sorted = sortCategoriesBySuperadmin(parsed);
          const seen = new Set();
          const list = [];
          sorted.forEach((c, idx) => {
            const label = c.label || c.name || "";
            let id = c.slug || label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
            if (label.toLowerCase() === "slices") id = "slices";
            if (label.toLowerCase().includes("2 in 1") || label.toLowerCase().includes("2in1")) id = "cheese-burst";
            if (label.toLowerCase().includes("big big")) id = "big-big-pizza";
            if (label.toLowerCase().includes("party combo") || label.toLowerCase() === "party combo") id = "party-combo";
            
            if (seen.has(id)) {
              id = `${id}-${c._id || idx}`;
            }
            seen.add(id);

            list.push({
              id,
              _id: c._id || c.id || `${id}-${idx}`,
              label,
              badge: c.badge || "",
              sort: c.sort ?? 0,
              createdAt: c.createdAt
            });
          });
          return list;
        }
      }
    } catch (e) {}
    return [
      { id: "slices", label: "Slices", badge: "NEW" },
      { id: "cheese-burst", label: "2in1 Cheese Burst", badge: "NEW" },
      { id: "big-big-pizza", label: "Big Big Pizza", badge: "New Flavours" },
      { id: "party-combo", label: "Party Combo", badge: "UPTO ₹1000 OFF" }
    ];
  });

  // Dynamic Promise Header & Campaign Taglines State (Superadmin controlled)
  const [promiseHeaderTitle, setPromiseHeaderTitle] = useState("Papa Veg Promise");
  const [promiseHeaderStars, setPromiseHeaderStars] = useState("★ ★");
  const [campaigns, setCampaigns] = useState([
    {
      _id: "c1",
      tagline: "Where quality food meets honest prices!"
    },
    {
      _id: "c2",
      tagline: "0% Preservatives & Fresh Dough Daily in Every Store"
    },
    {
      _id: "c3",
      tagline: "No Weather Surge & Free Delivery with Minimum Order"
    }
  ]);
  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0);

  // Auto-advance campaign slider every 4 seconds
  useEffect(() => {
    if (campaigns.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCampaignIndex((prev) => (prev + 1) % campaigns.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [campaigns.length]);

  // Fetch campaigns from backend superadmin promise-campaign API
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await apiClient.get('/settings/promise-campaign');
        const pData = res?.data?.data || res?.data;
        if (pData?.header?.title) {
          setPromiseHeaderTitle(pData.header.title);
        }
        if (pData?.header?.stars) {
          setPromiseHeaderStars(pData.header.stars);
        }
        if (pData?.tickerItems && pData.tickerItems.length > 0) {
          const activeTickers = pData.tickerItems.filter(t => t.isActive !== false);
          if (activeTickers.length > 0) {
            setCampaigns(activeTickers.map(t => ({
              _id: t.id,
              heading: t.heading || pData.header?.title || "Papa Veg Promise",
              tagline: t.tagline || pData.header?.subtitle || "Where quality food meets honest prices!",
              stars: pData.header?.stars || "★★"
            })));
            return;
          }
        }
      } catch (err) {
        // Fallback to legacy campaigns if any
      }

      try {
        const res = await apiClient.get('/dynamic-home/campaigns');
        const data = res?.data?.data || [];
        if (data.length > 0) {
          setCampaigns(data.map(c => ({
            _id: c._id || c.slug,
            heading: c.heading || c.name || "Papa Veg Promise",
            tagline: c.tagline || "100% Pure Vegetarian Delight",
            stars: "★★"
          })));
        }
      } catch (_) {}
    };
    fetchCampaigns();
  }, []);

  // Fetch dynamic categories and products from backend superadmin
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        let items = [];
        try {
          const res = await apiClient.get('/food/admin/category-products/public?sort=sort_asc');
          items = res?.data?.data || [];
        } catch (_) {
          try {
            const res = await apiClient.get('/food/admin/category-products/categories?sort=sort_asc');
            items = res?.data?.data || [];
          } catch (_) {
            const res = await apiClient.get('/food/admin/menu/public');
            items = res?.data?.data?.categories || [];
          }
        }

        if (items.length > 0) {
          const cats = items.filter(c => c.status !== "Inactive" && (c.type === "Category" || !c.type));
          const prods = items.filter(c => c.type === "Product");

          if (cats.length > 0) {
            const sortedCats = sortCategoriesBySuperadmin(cats);
            const seen = new Set();
            const mappedCats = [];
            sortedCats.forEach((c, idx) => {
              const label = c.label || c.name || "";
              let id = c.slug || label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
              if (label.toLowerCase() === "slices") id = "slices";
              if (label.toLowerCase().includes("2 in 1") || label.toLowerCase().includes("2in1")) id = "cheese-burst";
              if (label.toLowerCase().includes("big big")) id = "big-big-pizza";
              if (label.toLowerCase().includes("party combo") || label.toLowerCase() === "party combo") id = "party-combo";

              if (seen.has(id)) {
                id = `${id}-${c._id || idx}`;
              }
              seen.add(id);

              mappedCats.push({
                id,
                _id: c._id || c.id || `${id}-${idx}`,
                label,
                badge: c.badge || "",
                icon: c.icon || "",
                sort: c.sort ?? 0,
                createdAt: c.createdAt
              });
            });
            setCategories(mappedCats);
            localStorage.setItem("pvp_categories", JSON.stringify(mappedCats));
            if (!location.state?.category && mappedCats.length > 0) {
              setActiveTab(prev => {
                const exists = mappedCats.some(c => c.id === prev);
                return exists ? prev : mappedCats[0].id;
              });
            }
          }

          if (prods.length > 0) {
            const map = {};
            prods.forEach(p => {
              const catObj = cats.find(c => (c._id || c.id) === (typeof p.categoryId === 'object' ? p.categoryId?._id : p.categoryId));
              const catKey = catObj ? (catObj.slug || (catObj.label || catObj.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")) : "pizzas";
              if (!map[catKey]) map[catKey] = [];
              map[catKey].push({
                id: p._id || p.id,
                title: p.name,
                price: p.price || 299,
                badge: p.badge || "NEW",
                image: p.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500",
                description: p.shortDescription || p.description,
                rating: 4.5,
                ratingCount: 20
              });
            });
            setProductsMap(map);
          }
        }
      } catch (e) {
        console.warn("Failed to load backend category products:", e);
      }
    };
    fetchCategoryProducts();
  }, []);

  useEffect(() => {
    const handleCategoriesSync = () => {
      try {
        const stored = localStorage.getItem("pvp_categories");
        if (stored) {
          const parsed = JSON.parse(stored).filter(c => c.status !== "Inactive");
          if (parsed.length > 0) {
            const sorted = sortCategoriesBySuperadmin(parsed);
            const seen = new Set();
            const mapped = [];
            sorted.forEach((c, idx) => {
              const label = c.label || c.name || "";
              let id = c.slug || label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
              if (label.toLowerCase() === "slices") id = "slices";
              if (label.toLowerCase().includes("2 in 1") || label.toLowerCase().includes("2in1")) id = "cheese-burst";
              if (label.toLowerCase().includes("big big")) id = "big-big-pizza";
              if (label.toLowerCase().includes("party combo") || label.toLowerCase() === "party combo") id = "party-combo";

              if (seen.has(id)) {
                id = `${id}-${c._id || idx}`;
              }
              seen.add(id);

              mapped.push({
                id,
                _id: c._id || c.id || `${id}-${idx}`,
                label,
                badge: c.badge || "",
                sort: c.sort ?? 0,
                createdAt: c.createdAt
              });
            });
            setCategories(mapped);
          }
        }
      } catch (e) {}
    };
    window.addEventListener("pvp_categories_changed", handleCategoriesSync);
    return () => window.removeEventListener("pvp_categories_changed", handleCategoriesSync);
  }, []);

  // Dynamic Products Map State
  const [productsMap, setProductsMap] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_products_v2");
      if (stored) {
        const parsed = JSON.parse(stored).filter(p => p.status === "Active");
        if (parsed.length > 0) {
          const map = {};
          parsed.forEach(p => {
            const catKey = p.category ? p.category.toLowerCase().replace(/\s+/g, "-") : "pizzas";
            if (!map[catKey]) map[catKey] = [];
            
            const priceVal = typeof p.price === 'string' ? parseInt(p.price.replace(/[^\d]/g, ""), 10) || 299 : p.price || 299;
            map[catKey].push({
              id: p.id || `prod-${p.name.toLowerCase().replace(/\s+/g, "-")}`,
              title: p.name,
              price: priceVal,
              badge: "NEW",
              image: p.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
              description: p.description || `${p.name} prepared fresh with premium toppings.`,
              sizes: p.sizes || ["Regular", "Medium", "Large"],
              rating: p.rating || 4.5,
              ratingCount: Math.floor(Math.random() * 40) + 5
            });
          });
          return map;
        }
      }
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    const handleProductsSync = () => {
      try {
        const stored = localStorage.getItem("pvp_products_v2");
        if (stored) {
          const parsed = JSON.parse(stored).filter(p => p.status === "Active");
          if (parsed.length > 0) {
            const map = {};
            parsed.forEach(p => {
              const catKey = p.category ? p.category.toLowerCase().replace(/\s+/g, "-") : "pizzas";
              if (!map[catKey]) map[catKey] = [];
              
              const priceVal = typeof p.price === 'string' ? parseInt(p.price.replace(/[^\d]/g, ""), 10) || 299 : p.price || 299;
              map[catKey].push({
                id: p.id || `prod-${p.name.toLowerCase().replace(/\s+/g, "-")}`,
                title: p.name,
                price: priceVal,
                badge: "NEW",
                image: p.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=80",
                description: p.description || `${p.name} prepared fresh with premium toppings.`,
                sizes: p.sizes || ["Regular", "Medium", "Large"],
                rating: p.rating || 4.5,
                ratingCount: Math.floor(Math.random() * 40) + 5
              });
            });
            setProductsMap(map);
          }
        }
      } catch (e) {}
    };
    window.addEventListener("pvp_products_changed_v2", handleProductsSync);
    return () => window.removeEventListener("pvp_products_changed_v2", handleProductsSync);
  }, []);

  // Dynamic Toppings State
  const [toppings, setToppings] = useState(() => {
    const defaultToppings = [
      { name: "Jalapeno", price: 45, badge: "Bestseller" },
      { name: "Paneer", price: 55, badge: "Protein Rich" },
      { name: "Capsicum", price: 45 },
      { name: "Mushroom", price: 45 },
      { name: "Onion", price: 45 },
      { name: "Red Paprika", price: 45 },
      { name: "Red Capsicum", price: 45 },
      { name: "Sweet Corn", price: 45 },
      { name: "Tomato", price: 45 }
    ];
    try {
      const stored = localStorage.getItem("pvp_addons");
      if (stored) {
        const parsed = JSON.parse(stored).filter(a => a.status === "active" && a.type === "topping");
        if (parsed.length > 0) {
          return parsed.map(a => ({
            name: a.name,
            price: a.price,
            badge: a.category === "Pizza" ? "Bestseller" : ""
          }));
        }
      }
    } catch (e) {}
    return defaultToppings;
  });

  useEffect(() => {
    const handleToppingsSync = () => {
      try {
        const stored = localStorage.getItem("pvp_addons");
        if (stored) {
          const parsed = JSON.parse(stored).filter(a => a.status === "active" && a.type === "topping");
          if (parsed.length > 0) {
            setToppings(parsed.map(a => ({
              name: a.name,
              price: a.price,
              badge: a.category === "Pizza" ? "Bestseller" : ""
            })));
          }
        }
      } catch (e) {}
    };
    window.addEventListener("pvp_addons_changed", handleToppingsSync);
    return () => window.removeEventListener("pvp_addons_changed", handleToppingsSync);
  }, []);

  const getMergedMenuItems = () => {
    const finalMap = { ...MENU_ITEMS };
    if (productsMap) {
      Object.keys(productsMap).forEach(key => {
        const list = finalMap[key] ? [...finalMap[key]] : [];
        const dynamicList = productsMap[key] || [];
        dynamicList.forEach(dp => {
          if (!list.some(lp => lp.title.toLowerCase() === dp.title.toLowerCase())) {
            list.push(dp);
          }
        });
        finalMap[key] = list;
      });
    }
    return finalMap;
  };
  
  const currentMenuItems = getMergedMenuItems();

  const [activeTab, setActiveTab] = useState(() => {
    const defaultTab = location.state?.category;
    if (defaultTab) return defaultTab;
    try {
      const stored = localStorage.getItem("pvp_categories");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.length > 0 && parsed[0]?.id) return parsed[0].id;
      }
    } catch (_) {}
    return "slices";
  });

  const [menuFilters, setMenuFilters] = useState(() => {
    try {
      const saved = localStorage.getItem("pvp_menu_filters");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      vegOnly: { enabled: true, label: "Veg Only", defaultActive: true },
      sortBy: { enabled: true, label: "Sort by", defaultOption: "default" }
    };
  });

  const [isVegOnly, setIsVegOnly] = useState(() => {
    try {
      const saved = localStorage.getItem("pvp_menu_filters");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.vegOnly?.defaultActive !== undefined) return parsed.vegOnly.defaultActive;
      }
    } catch (_) {}
    return true;
  });

  const [isVegetarian, setIsVegetarian] = useState(true);

  const [sortBy, setSortBy] = useState(() => {
    try {
      const saved = localStorage.getItem("pvp_menu_filters");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sortBy?.defaultOption) return parsed.sortBy.defaultOption;
      }
    } catch (_) {}
    return "default";
  });

  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);

  // Sync menuFilters from backend & localStorage
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await apiClient.get('/settings/home-page');
        const mf = res?.data?.data?.menuFilters;
        if (mf) {
          setMenuFilters(mf);
          localStorage.setItem("pvp_menu_filters", JSON.stringify(mf));
        }
      } catch (_) {}
    };
    fetchFilters();

    const handleFilterSync = (e) => {
      if (e?.detail) {
        setMenuFilters(e.detail);
      } else {
        try {
          const saved = localStorage.getItem("pvp_menu_filters");
          if (saved) setMenuFilters(JSON.parse(saved));
        } catch (_) {}
      }
    };
    window.addEventListener("pvp_menu_filters_changed", handleFilterSync);
    return () => window.removeEventListener("pvp_menu_filters_changed", handleFilterSync);
  }, []);

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target)) {
        setShowSortMenu(false);
      }
    };
    if (showSortMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSortMenu]);

  const [showServiceSelector, setShowServiceSelector] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [showCarModal, setShowCarModal] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("deliveryAddress") || "") : ""
  })
  const [takeawayHut, setTakeawayHut] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("takeawayHut") || "") : ""
  })
  const [carNumber, setCarNumber] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("carNumber") || "") : ""
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [expandedItems, setExpandedItems] = useState({})

  const [selectedCrust, setSelectedCrust] = useState("Ultimate Cheese")
  const [selectedSizeOption, setSelectedSizeOption] = useState({ name: "Small", price: 299 })
  const [selectedExtraCheese, setSelectedExtraCheese] = useState(false)
  const [selectedMealOptions, setSelectedMealOptions] = useState([])
  const [selectedToppingsList, setSelectedToppingsList] = useState([])
  const [quantity, setQuantity] = useState(1)

  const openCustomizeModal = (item) => {
    setCustomizeItem(item)
    setSelectedCrust("Ultimate Cheese")
    setSelectedSizeOption({ name: "Small", price: item.price })
    setSelectedExtraCheese(false)
    setSelectedMealOptions([])
    setSelectedToppingsList([])
    setQuantity(1)
  }

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  // Debouncing logic for search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery])

  // Reset search query when active category tab changes
  useEffect(() => {
    setSearchQuery("")
  }, [activeTab])

  // Sync local location state with global location confirmation changes
  useEffect(() => {
    if (locationConfirmed) {
      setDeliveryAddress(localStorage.getItem("deliveryAddress") || "")
      setTakeawayHut(localStorage.getItem("takeawayHut") || "")
      setCarNumber(localStorage.getItem("carNumber") || "")
    } else {
      setDeliveryAddress("")
      setTakeawayHut("")
      setCarNumber("")
    }
  }, [locationConfirmed])
  const [activeService, setActiveService] = useState(localStorage.getItem("activeService") || "delivery")
  const [toast, setToast] = useState({ visible: false, message: "" })

  // Sync global location modal open state with local modal trigger
  useEffect(() => {
    if (isModalOpen) {
      setShowServiceSelector(true)
    } else {
      setShowServiceSelector(false)
    }
  }, [isModalOpen])

  const triggerToast = (message) => {
    setToast({ visible: true, message })
    setTimeout(() => {
      setToast({ visible: false, message: "" })
    }, 2500)
  }

  useEffect(() => {
    if (location.state?.category) {
      const cat = location.state.category
      if (cat === "pizza") setActiveTab("pizzas")
      else if (cat === "burger") setActiveTab("burgers")
      else if (cat === "bread") setActiveTab("breads")
      else if (cat === "pasta" || cat === "desserts" || cat === "drinks") {
        setActiveTab(cat)
      }
    }
  }, [location.state])
  const [locationName, setLocationName] = useState(localStorage.getItem("deliveryAddress") || "")
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("userCart") || "{}")
    } catch (e) {
      return {}
    }
  })

  // Sync cart from localStorage dynamically
  useEffect(() => {
    const handleCartSync = () => {
      try {
        const storedCart = JSON.parse(localStorage.getItem("userCart") || "{}")
        setCart(storedCart)
      } catch (e) {
        setCart({})
      }
    }
    window.addEventListener("cartUpdated", handleCartSync)
    return () => window.removeEventListener("cartUpdated", handleCartSync)
  }, [])

  // Custom Customize Modal States
  const [customizeItem, setCustomizeItem] = useState(null)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedToppings, setSelectedToppings] = useState([])
  const [selectedCheeseDip, setSelectedCheeseDip] = useState([])
  const [selectedKetchup, setSelectedKetchup] = useState([])
  const [selectedBreadDips, setSelectedBreadDips] = useState([])

  // Load fonts and icons
  useEffect(() => {
    const linkFonts = document.createElement("link")
    linkFonts.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;600;700&display=swap"
    linkFonts.rel = "stylesheet"
    document.head.appendChild(linkFonts)

    const linkIcons = document.createElement("link")
    linkIcons.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
    linkIcons.rel = "stylesheet"
    document.head.appendChild(linkIcons)

    // Load active location
    const storedLoc = localStorage.getItem("deliveryAddress")
    if (storedLoc) {
      setLocationName(storedLoc)
      setDeliveryAddress(storedLoc)
    }

    return () => {
      document.head.removeChild(linkFonts)
      document.head.removeChild(linkIcons)
    }
  }, [])

  const addToCart = (item, size = "") => {
    const key = size ? `${item.id}-${size}` : item.id
    setCart(prev => {
      const existing = prev[key]
      const newQty = existing ? existing.quantity + 1 : 1
      return {
        ...prev,
        [key]: {
          ...item,
          selectedSize: size,
          quantity: newQty
        }
      }
    })

    // Save to global localStorage cart for sync
    const currentLocalCart = JSON.parse(localStorage.getItem("userCart") || "{}")
    currentLocalCart[key] = (currentLocalCart[key] || 0) + 1
    localStorage.setItem("userCart", JSON.stringify(currentLocalCart))

    // Dispatch event to trigger Home basket recalculation
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const calculateTotalPrice = () => {
    if (!customizeItem) return 0
    let base = selectedSizeOption.price || customizeItem.price
    if (selectedExtraCheese) base += 65
    
    selectedMealOptions.forEach(opt => {
      if (opt === "Pepsi Pet") base += 57
      if (opt === "Masala Pop") base += 99
      if (opt === "Indi Cheese Pocket") base += 109
      if (opt === "Choco Volcano") base += 119
      if (opt === "Cheese Garlic Bread") base += 165
    })
    
    selectedToppingsList.forEach(opt => {
      const matched = toppings.find(t => t.name === opt)
      if (matched) {
        base += matched.price
      } else {
        if (opt === "Jalapeno") base += 45
        if (opt === "Paneer") base += 55
        if (opt === "Capsicum") base += 45
        if (opt === "Mushroom") base += 45
        if (opt === "Onion") base += 45
        if (opt === "Red Paprika") base += 45
        if (opt === "Red Capsicum") base += 45
        if (opt === "Sweet Corn") base += 45
        if (opt === "Tomato") base += 45
      }
    })
    
    return base * quantity
  }

  const addCustomizedToCart = () => {
    const toppingsKey = selectedToppingsList.sort().join("-")
    const mealsKey = selectedMealOptions.sort().join("-")
    const key = `${customizeItem.id}-${selectedSizeOption.name}-${selectedCrust}-${selectedExtraCheese ? 'cheese' : 'no'}-${toppingsKey}-${mealsKey}`
    
    const customizedItemDetails = {
      ...customizeItem,
      id: customizeItem.id,
      title: `${customizeItem.title} (${selectedSizeOption.name})`,
      price: calculateTotalPrice() / quantity, // Price per unit
      description: `Crust: ${selectedCrust}${selectedExtraCheese ? ', Extra Cheese' : ''}${selectedToppingsList.length > 0 ? ', Toppings: ' + selectedToppingsList.join(', ') : ''}${selectedMealOptions.length > 0 ? ', Meal: ' + selectedMealOptions.join(', ') : ''}`,
      customized: true,
      selectedSize: selectedSizeOption.name,
      toppings: selectedToppingsList,
      meals: selectedMealOptions,
      crust: selectedCrust,
      extraCheese: selectedExtraCheese
    }
    
    setCart(prev => {
      const existing = prev[key]
      const newQty = existing ? existing.quantity + quantity : quantity
      return {
        ...prev,
        [key]: {
          ...customizedItemDetails,
          quantity: newQty
        }
      }
    })
    
    // Save to localStorage
    const currentLocalCart = JSON.parse(localStorage.getItem("userCart") || "{}")
    currentLocalCart[key] = (currentLocalCart[key] || 0) + quantity
    localStorage.setItem("userCart", JSON.stringify(currentLocalCart))
    
    window.dispatchEvent(new Event("cartUpdated"))
    setCustomizeItem(null)
    triggerToast(`Added ${customizeItem.title} to cart!`)
  }

  const totalCartCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)
  const totalCartPrice = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Helper to safely parse numeric price
  const getNumericPrice = (item) => {
    if (typeof item.price === "number") return item.price;
    const num = parseFloat(String(item.price || 0).replace(/[^\d.]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  // Helper to safely parse numeric rating
  const getNumericRating = (item) => {
    if (typeof item.rating === "number") return item.rating;
    const num = parseFloat(String(item.rating || 0).replace(/[^\d.]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  // Filter and sort menu items
  const itemsForTab = currentMenuItems[activeTab] || currentMenuItems["slices"] || currentMenuItems["pizzas"] || [];
  const filteredItems = itemsForTab.filter((item) => {
    // If veg-only toggle is active and item is marked explicitly as non-veg
    if (isVegOnly && item.isVeg === false) {
      return false;
    }
    const titleMatch = item.title?.toLowerCase().includes(debouncedQuery.toLowerCase());
    const descMatch = item.description?.toLowerCase().includes(debouncedQuery.toLowerCase());
    return !debouncedQuery || titleMatch || descMatch;
  }).sort((a, b) => {
    if (sortBy === "price_asc") return getNumericPrice(a) - getNumericPrice(b);
    if (sortBy === "price_desc") return getNumericPrice(b) - getNumericPrice(a);
    if (sortBy === "rating") return getNumericRating(b) - getNumericRating(a);
    return 0;
  });

  const modalTextPrimary = isDarkMode ? "text-white" : "text-zinc-900"
  const modalTextSecondary = isDarkMode ? "text-zinc-400" : "text-zinc-500"
  const modalLabelMuted = isDarkMode ? "text-white/50" : "text-zinc-400 font-bold"
  const modalCheckboxText = isDarkMode ? "text-white/80" : "text-zinc-750 font-semibold"
  const modalBorder = isDarkMode ? "border-white/10" : "border-zinc-200"

  return (
    <div className={`min-h-screen flex justify-center transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-[#F8F6F2]"}`}>
      <div className={`page-wrapper w-full max-w-md min-h-screen pb-32 font-body-md overflow-x-hidden relative shadow-2xl border-x ${
        isDarkMode ? "border-zinc-800/40" : "border-gray-200/50"
      }`} style={{ backgroundColor: isDarkMode ? "#111111" : "#F8F6F2", color: isDarkMode ? "#e5e2e1" : "#1c1b1b" }}>
      {/* CSS overrides to keep design exact */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-card {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.92)"} !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(229, 57, 53, 0.16)"} !important;
          box-shadow: ${isDarkMode ? "none" : "0 10px 30px -5px rgba(229, 57, 53, 0.08), 0 4px 16px -4px rgba(0, 0, 0, 0.06)"} !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .glass-card:hover {
          box-shadow: ${isDarkMode ? "none" : "0 20px 40px -8px rgba(229, 57, 53, 0.16), 0 10px 20px -6px rgba(0, 0, 0, 0.08)"} !important;
          border-color: ${isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(229, 57, 53, 0.3)"} !important;
          transform: translateY(-2px) !important;
        }
        fieldset.glass-card {
          display: block !important;
          margin: 0 0 16px 0 !important;
          min-width: 0 !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none !important; }
        .hide-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        
        .font-headline-lg-mobile {
          font-family: 'Plus Jakarta Sans', sans-serif !important;
          font-weight: 700 !important;
          font-size: 28px !important;
          line-height: 34px !important;
        }
        .font-body-md {
          font-family: 'Inter', sans-serif !important;
          font-size: 16px !important;
          line-height: 24px !important;
          font-weight: 400 !important;
        }
        .font-label-sm {
          font-family: 'Inter', sans-serif !important;
          font-size: 12px !important;
          line-height: 16px !important;
          font-weight: 600 !important;
          letter-spacing: 0.05em !important;
        }
        
        .veg-box {
          border: 2px solid #00C853;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .veg-circle {
          background-color: #00C853;
          border-radius: 50%;
          width: 6px;
          height: 6px;
        }
        .text-primary {
          color: #E53935 !important;
        }
        .bg-primary {
          background-color: #E53935 !important;
        }
        .text-on-primary {
          color: #ffffff !important;
        }
        
        .bg-surface\/80 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.8)" : "rgba(255, 255, 255, 0.8)"} !important;
        }
        .bg-surface\/85 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.85)" : "rgba(255, 255, 255, 0.85)"} !important;
        }
        .bg-surface\/90 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.9)" : "rgba(255, 255, 255, 0.9)"} !important;
        }
        .bg-surface {
          background-color: ${isDarkMode ? "#131313" : "#ffffff"} !important;
        }
        .border-white\/10 {
          border-color: ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"} !important;
        }
        .border-white\/12 {
          border-color: ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)"} !important;
        }
        .bg-white\/5 {
          background-color: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)"} !important;
        }
        .text-white\/70 {
          color: ${isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(19, 19, 19, 0.7)"} !important;
        }
        .text-white\/50 {
          color: ${isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(19, 19, 19, 0.5)"} !important;
        }
        .bg-black\/40 {
          background-color: ${isDarkMode ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.5)"} !important;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .slide-up-modal {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        `
      }} />

      {/* Custom Toast Alert */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-55 bg-[#E53935] text-white px-6 py-3 rounded-full shadow-2xl glass-card font-label-sm text-xs border border-white/20 animate-bounce">
          {toast.message}
        </div>
      )}

      {/* ── TOP STICKY CONTAINER (Header + Filters + Category Tabs) ── */}
      <div className="sticky top-0 z-45 bg-[#F8F6F2] dark:bg-[#111111] border-b border-zinc-200/60 dark:border-zinc-800 shadow-xs">
        
        {/* Row 1: Back + Menu Title + Search Bar */}
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate('/user')}
            className="p-1 -ml-1 text-gray-800 dark:text-white hover:bg-black/5 dark:hover:bg-zinc-800 rounded-full transition-colors flex items-center justify-center bg-transparent border-0 outline-none cursor-pointer"
            aria-label="Go back to user home"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
          </button>
          
          <h1 className="text-xl font-black text-gray-900 dark:text-white shrink-0 tracking-tight">
            Menu
          </h1>

          {/* Search in menu input */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in menu..."
              className="w-full h-9 pl-9 pr-8 bg-white/90 dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none focus:border-red-500 focus:bg-white transition-colors shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 bg-transparent border-0 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Filters (Veg Only & Sort by) - Dynamically configured via superadmin */}
        {(menuFilters.vegOnly?.enabled !== false || menuFilters.sortBy?.enabled !== false) && (
          <div className="px-4 pb-2.5 flex items-center gap-2 relative">
            {/* Veg Only Button */}
            {menuFilters.vegOnly?.enabled !== false && (
              <button
                type="button"
                onClick={() => setIsVegOnly(!isVegOnly)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                  isVegOnly
                    ? "bg-green-50 dark:bg-green-950/30 border-green-600 text-green-700 dark:text-green-400 shadow-xs"
                    : "bg-white/80 hover:bg-white dark:bg-zinc-900 border-zinc-250 dark:border-zinc-800 text-gray-700 dark:text-gray-300 shadow-2xs"
                }`}
              >
                {/* Green Veg Indicator icon */}
                <span className="w-3.5 h-3.5 border border-green-600 p-[1.5px] rounded-[3px] flex items-center justify-center bg-transparent">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 block" />
                </span>
                <span>{menuFilters.vegOnly?.label || "Veg Only"}</span>
              </button>
            )}

            {/* Sort By Button */}
            {menuFilters.sortBy?.enabled !== false && (
              <div className="relative" ref={sortMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                    sortBy !== "default"
                      ? "border-red-500/50 text-red-600 dark:text-red-400 bg-red-50/40 dark:bg-red-950/20"
                      : "border-zinc-250 dark:border-zinc-800 bg-white/80 hover:bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span>{menuFilters.sortBy?.label || "Sort by"}</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                </button>

                {/* Sort Dropdown */}
                {showSortMenu && (
                  <div className="absolute left-0 top-full mt-1.5 w-44 bg-[#F8F6F2] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { id: "default", label: "Recommended" },
                      { id: "price_asc", label: "Price: Low to High" },
                      { id: "price_desc", label: "Price: High to Low" },
                      { id: "rating", label: "Rating: High to Low" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.id);
                          setShowSortMenu(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-xs font-medium flex items-center justify-between hover:bg-black/5 dark:hover:bg-zinc-800 cursor-pointer border-0 ${
                          sortBy === opt.id
                            ? "text-red-600 dark:text-red-400 font-bold bg-red-50/50 dark:bg-red-950/20"
                            : "text-gray-700 dark:text-gray-300 bg-transparent"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-red-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Row 3: Horizontal Categories Tabs */}
        <div className="flex items-center overflow-x-auto hide-scrollbar px-3 border-t border-zinc-200/60 dark:border-zinc-800/80 bg-[#F8F6F2] dark:bg-[#111111]">
          {categories.map((cat, idx) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat._id || `${cat.id}-${idx}`}
                type="button"
                onClick={() => setActiveTab(cat.id)}
                className="flex flex-col items-center pt-2 px-3.5 shrink-0 transition-colors group cursor-pointer relative bg-transparent border-0"
              >
                {/* Badge Tag */}
                {cat.badge ? (
                  <span className="text-[9px] font-black text-white bg-[#E53935] px-2 py-0.5 rounded-full uppercase leading-none tracking-tight mb-1 shadow-xs whitespace-nowrap">
                    {cat.badge}
                  </span>
                ) : (
                  <span className="h-4 block" />
                )}

                {/* Category Title */}
                <span className={`text-xs whitespace-nowrap pb-2 ${
                  isActive
                    ? "font-extrabold text-gray-900 dark:text-white"
                    : "font-semibold text-gray-500 dark:text-gray-400 group-hover:text-gray-800"
                }`}>
                  {cat.label}
                </span>

                {/* Red Underline Active Indicator */}
                {isActive && (
                  <div className="h-[3px] bg-[#E53935] w-full rounded-t-sm" />
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* Campaign Promise Slider (Superadmin dynamic) - Full Width */}
      {campaigns.length > 0 && (
        <div 
          onClick={() => navigate('/user/promise')}
          className="w-full bg-[#F8F6F2] dark:bg-[#18181a] py-3.5 px-4 border-b border-zinc-200/60 dark:border-zinc-800 shadow-xs transition-all hover:bg-[#f3ece4] dark:hover:bg-[#1f1f23] cursor-pointer group"
          role="button"
          tabIndex={0}
          title="Click to view Papa Veg Promise details"
        >
          <div className="max-w-xl mx-auto relative text-center">
            {/* Campaign Promise Heading - STATIC SINGLE LINE (Does NOT slide) */}
            <div className="flex items-center justify-center gap-1.5 mb-1 group-hover:scale-[1.01] transition-transform whitespace-nowrap overflow-hidden">
              <span className="text-[var(--primary,#EE3A43)] font-black text-lg md:text-xl tracking-tight flex items-center gap-1 font-sans truncate">
                {promiseHeaderTitle || "Papa Veg Promise"}
              </span>
              <span className="text-[#70e000] text-sm font-bold tracking-widest shrink-0">
                {promiseHeaderStars || "★ ★"}
              </span>
            </div>
            
            {/* Subtle accent underline */}
            <div className="w-24 h-[2.5px] bg-[#70e000] mx-auto rounded-full mb-2 shadow-xs" />

            {/* Tagline / Promise text - THIS IS THE ONLY PART THAT SLIDES */}
            <div className="overflow-hidden min-h-[20px] flex items-center justify-center">
              <p 
                key={activeCampaignIndex}
                className="text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-bold tracking-tight px-4 line-clamp-1 transition-opacity duration-300"
              >
                {campaigns[activeCampaignIndex]?.tagline || "Where quality food meets honest prices!"}
              </p>
            </div>

            {/* Carousel Dot Indicators - changed active dot to #70e000 (3rd image update) */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              {campaigns.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCampaignIndex(idx);
                  }}
                  className={`transition-all rounded-full border-0 p-0 cursor-pointer ${
                    activeCampaignIndex === idx 
                      ? "w-2.5 h-2.5 bg-[#70e000] shadow-xs" 
                      : "w-2 h-2 bg-gray-300 dark:bg-zinc-700 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Categories Layout container */}
      <main className="px-4 space-y-4 max-w-lg mx-auto pt-0">

        {/* Section Divider Header */}
        <div className="flex items-center justify-center mt-2 mb-4 px-4">
          <div className="flex-1 h-[1px] bg-gray-200 dark:bg-zinc-800"></div>
          <h2 className="px-5 text-xl font-extrabold text-gray-900 dark:text-white capitalize tracking-tight">
            {categories.find(c => c.id === activeTab)?.label || activeTab}
          </h2>
          <div className="flex-1 h-[1px] bg-gray-200 dark:bg-zinc-800"></div>
        </div>

         {/* Menu list grid */}
        <section className="space-y-4">
          {filteredItems.map((item) => (
            <fieldset key={item.id} className="glass-card rounded-2xl overflow-hidden flex flex-col p-4 gap-1.5 border border-white/12 hover-glow transition-all duration-300 m-0 min-w-0">
              
              {/* Top Row: Details on left, Image & ADD Button on right */}
              <div className="flex flex-row justify-between gap-4">
                
                {/* Left Details: Title, Price, Size Selector */}
                <div className="flex-1 flex flex-col justify-start min-w-0 text-left gap-1">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="veg-box scale-75 shrink-0"><span className="veg-circle"></span></span>
                      {item.badge && (
                        <span className="bg-[#E53935]/10 text-[#E53935] text-[8px] font-black uppercase px-1.5 py-0.5 rounded tracking-wide">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <h3 className={`font-headline-md-mobile text-xl leading-snug font-extrabold truncate ${isDarkMode ? "text-white" : "text-[#131313]"}`}>
                      {item.title}
                    </h3>
                  </div>

                  <div className="mt-1 flex flex-row items-center gap-3 text-left">
                    <span className="text-primary font-black text-sm">₹{item.price}</span>
                    
                    {/* Rating Pill Badge */}
                    <div className="flex items-center gap-1 bg-[#00c853]/10 dark:bg-[#00c853]/15 text-[#00c853] px-2 py-0.5 rounded-full text-[10px] font-black w-fit select-none">
                      <span className="text-[9px]">★</span>
                      <span>{item.rating || '4.3'}</span>
                      <span className="opacity-70 font-semibold">({item.ratingCount || '19'})</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Product Image & ADD Button Stack */}
                <div className={`relative w-24 shrink-0 flex flex-col items-center ${(activeTab === "pizzas" || activeTab === "breads") ? "pb-4" : "pb-1"}`}>
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-200/10 shadow-sm">
                    <img
                      className="w-full h-full object-cover"
                      alt={item.title}
                      src={item.image}
                    />
                  </div>
                  
                  {/* ADD Button overlapping bottom of image */}
                  <button
                    onClick={() => checkLocation(() => {
                      if (activeTab === "pizzas") {
                        openCustomizeModal(item)
                      } else {
                        addToCart(item, selectedSize)
                        triggerToast(`Added ${item.title} to cart!`)
                      }
                    })}
                    className="absolute top-[80px] left-1/2 -translate-x-1/2 h-7 px-5 bg-[#E53935] hover:bg-red-700 text-white rounded-full font-label-sm text-[10px] uppercase font-black cursor-pointer border-0 active:scale-95 transition-all shadow-md shadow-[#E53935]/20 flex items-center justify-center whitespace-nowrap min-w-[65px] z-10"
                  >
                    ADD
                  </button>

                  {/* Customisable hint below add button */}
                  {(activeTab === "pizzas" || activeTab === "breads") && (
                    <span className="mt-3.5 text-zinc-500 dark:text-zinc-400 text-[10px] font-medium tracking-wide whitespace-nowrap select-none">
                      Customisable
                    </span>
                  )}
                </div>

              </div>

              {/* Bottom Row: Description spanning full-width */}
              {item.description && (
                <div className="pt-1.5 border-t border-dashed border-white/5 text-left">
                  <p className={`text-[10px] leading-normal ${isDarkMode ? "text-white/60" : "text-zinc-500"}`}>
                    {expandedItems[item.id]
                      ? item.description
                      : `${item.description.slice(0, 50)}${item.description.length > 50 ? "..." : ""}`}
                    {item.description.length > 50 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpand(item.id)
                        }}
                        className="ml-1 text-primary hover:underline font-bold bg-transparent border-0 outline-none cursor-pointer text-[10px]"
                      >
                        {expandedItems[item.id] ? "less" : "more"}
                      </button>
                    )}
                  </p>
                </div>
              )}

            </fieldset>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-16 opacity-50 space-y-3">
              <span className="material-symbols-outlined text-4xl">
                {searchQuery ? "search_off" : "local_pizza"}
              </span>
              <p className="font-bold text-xs uppercase tracking-wider">
                {searchQuery ? "No items match your search" : "No items available in this category"}
              </p>
            </div>
          )}
        </section>
      </main>

      {/* Floating Customize Overlay Modal (Swiggy / Pizza Hut style) */}
      {customizeItem && (
        <div className="fixed inset-0 z-55 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
          {/* Modal Container */}
          <div className="w-full max-w-md bg-[#f3f3f5] dark:bg-[#18181a] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden transition-colors duration-300 slide-up-modal">
            
            {/* Header: Sticky Top */}
            <div className="bg-white dark:bg-[#1f1f22] px-5 py-4 flex items-center justify-between border-b border-zinc-200/50 dark:border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={customizeItem.image}
                  alt={customizeItem.title}
                  className="w-10 h-10 rounded-lg object-cover bg-zinc-900 border border-zinc-200/10"
                />
                <h3 className="font-headline-lg-mobile text-base text-zinc-900 dark:text-white truncate max-w-[240px]">
                  {customizeItem.title}
                </h3>
              </div>
              <button
                onClick={() => setCustomizeItem(null)}
                className="material-symbols-outlined text-zinc-400 hover:text-zinc-600 dark:hover:text-white cursor-pointer bg-transparent border-0 outline-none p-1 flex items-center justify-center"
              >
                close
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Rabbit Speech Banner */}
              <div className="bg-[#e8e7fa] dark:bg-[#2b254a] rounded-2xl p-4 flex gap-3 items-start">
                <span className="text-xl select-none">🐰</span>
                <p className="text-xs text-[#3b2b85] dark:text-[#a89dfc] font-semibold leading-relaxed text-left">
                  Hi, we've preselected some popular choices to help you place the order faster!
                </p>
              </div>

              {/* 1. Choose Your Crust */}
              <div className="space-y-2">
                <div className="text-left">
                  <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">Choose Your Crust</h4>
                </div>
                <div className="bg-white dark:bg-[#1f1f22] rounded-2xl p-4 shadow-sm border border-zinc-200/30 dark:border-white/5 space-y-3">
                  {[
                    "Ultimate Cheese",
                    "Personal Pan",
                    "Medium Hand Tossed",
                    "Large Stuffed Crust"
                  ].map(crust => {
                    const isSelected = selectedCrust === crust
                    return (
                      <div
                        key={crust}
                        onClick={() => setSelectedCrust(crust)}
                        className="flex items-center justify-between cursor-pointer py-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="veg-box scale-75 shrink-0"><span className="veg-circle"></span></span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{crust}</span>
                        </div>
                        <div className="relative flex items-center justify-center">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-[#ff5200]" : "border-zinc-400 dark:border-zinc-600"
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#ff5200]" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 2. Choose Size */}
              <div className="space-y-2">
                <div className="text-left">
                  <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">Choose Size</h4>
                  <p className="text-[10px] text-zinc-400 font-bold">Select any 1</p>
                </div>
                <div className="bg-white dark:bg-[#1f1f22] rounded-2xl p-4 shadow-sm border border-zinc-200/30 dark:border-white/5 space-y-3">
                  {[
                    { name: "Small", price: customizeItem.price },
                    { name: "Medium", price: customizeItem.price + 220 },
                    { name: "Large", price: customizeItem.price + 380 }
                  ].map(sizeObj => {
                    const isSelected = selectedSizeOption.name === sizeObj.name
                    return (
                      <div
                        key={sizeObj.name}
                        onClick={() => setSelectedSizeOption(sizeObj)}
                        className="flex items-center justify-between cursor-pointer py-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="veg-box scale-75 shrink-0"><span className="veg-circle"></span></span>
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{sizeObj.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">₹{sizeObj.price}</span>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? "border-[#ff5200]" : "border-zinc-400 dark:border-zinc-600"
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-[#ff5200]" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 3. Extra Cheese Topping */}
              <div className="space-y-2">
                <div className="text-left">
                  <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">Extra Cheese Topping</h4>
                  <p className="text-[10px] text-zinc-400 font-bold">Select upto 1</p>
                </div>
                <div className="bg-white dark:bg-[#1f1f22] rounded-2xl p-4 shadow-sm border border-zinc-200/30 dark:border-white/5">
                  <div
                    onClick={() => setSelectedExtraCheese(!selectedExtraCheese)}
                    className="flex items-center justify-between cursor-pointer py-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="veg-box scale-75 shrink-0"><span className="veg-circle"></span></span>
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Cheese</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">+ ₹65</span>
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        selectedExtraCheese ? "border-[#ff5200] bg-[#ff5200] text-white" : "border-zinc-400 dark:border-zinc-600"
                      }`}>
                        {selectedExtraCheese && <span className="material-symbols-outlined text-[10px] font-bold">check</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Make it a Meal */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">Make it a Meal.</h4>
                    <p className="text-[10px] text-zinc-400 font-bold">Select upto 5</p>
                  </div>
                  <button
                    onClick={() => {
                      const allMeals = ["Pepsi Pet", "Masala Pop", "Indi Cheese Pocket", "Choco Volcano", "Cheese Garlic Bread"]
                      setSelectedMealOptions(prev => prev.length === allMeals.length ? [] : allMeals)
                    }}
                    className="text-xs text-[#E53935] font-black uppercase bg-transparent border-0 outline-none cursor-pointer hover:underline"
                  >
                    {selectedMealOptions.length === 5 ? "Deselect all" : "Select all"}
                  </button>
                </div>
                <div className="bg-white dark:bg-[#1f1f22] rounded-2xl p-4 shadow-sm border border-zinc-200/30 dark:border-white/5 space-y-3">
                  {[
                    { name: "Pepsi Pet", price: 57, badge: "Bestseller" },
                    { name: "Masala Pop", price: 99 },
                    { name: "Indi Cheese Pocket", price: 109 },
                    { name: "Choco Volcano", price: 119 },
                    { name: "Cheese Garlic Bread", price: 165 }
                  ].map(meal => {
                    const isSelected = selectedMealOptions.includes(meal.name)
                    return (
                      <div
                        key={meal.name}
                        onClick={() => {
                          setSelectedMealOptions(prev => 
                            prev.includes(meal.name) 
                              ? prev.filter(m => m !== meal.name) 
                              : [...prev, meal.name]
                          )
                        }}
                        className="flex items-center justify-between cursor-pointer py-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="veg-box scale-75 shrink-0"><span className="veg-circle"></span></span>
                          <div className="text-left">
                            {meal.badge && (
                              <span className="text-[8px] font-black uppercase text-[#E53935] tracking-wide block leading-none mb-0.5">{meal.badge}</span>
                            )}
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{meal.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">+ ₹{meal.price}</span>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? "border-[#ff5200] bg-[#ff5200] text-white" : "border-zinc-400 dark:border-zinc-600"
                          }`}>
                            {isSelected && <span className="material-symbols-outlined text-[10px] font-bold">check</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 5. Add Toppings */}
              <div className="space-y-2">
                <div className="text-left">
                  <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white">Add More Veg Toppings Personal</h4>
                  <p className="text-[10px] text-zinc-400 font-bold">Select upto 2</p>
                </div>
                <div className="bg-white dark:bg-[#1f1f22] rounded-2xl p-4 shadow-sm border border-zinc-200/30 dark:border-white/5 space-y-3">
                  {toppings.map(top => {
                    const isSelected = selectedToppingsList.includes(top.name)
                    return (
                      <div
                        key={top.name}
                        onClick={() => {
                          setSelectedToppingsList(prev => {
                            if (prev.includes(top.name)) {
                              return prev.filter(t => t !== top.name)
                            } else {
                              if (prev.length >= 2) {
                                triggerToast("You can select up to 2 toppings!")
                                return prev
                              }
                              return [...prev, top.name]
                            }
                          })
                        }}
                        className="flex items-center justify-between cursor-pointer py-1"
                      >
                        <div className="flex items-center gap-2">
                          <span className="veg-box scale-75 shrink-0"><span className="veg-circle"></span></span>
                          <div className="text-left">
                            {top.badge && (
                              <span className={`text-[8px] font-black uppercase tracking-wide block leading-none mb-0.5 ${
                                top.badge === "Bestseller" ? "text-primary" : "text-pink-600 dark:text-pink-400"
                              }`}>{top.badge}</span>
                            )}
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{top.name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-zinc-500 dark:text-zinc-400">+ ₹{top.price}</span>
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isSelected ? "border-[#ff5200] bg-[#ff5200] text-white" : "border-zinc-400 dark:border-zinc-600"
                          }`}>
                            {isSelected && <span className="material-symbols-outlined text-[10px] font-bold">check</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

            </div>

            {/* Footer: Fixed Bottom */}
            <div className="bg-white dark:bg-[#1f1f22] p-4 flex items-center justify-between gap-4 border-t border-zinc-200/50 dark:border-white/5 shrink-0">
              {/* Quantity Selector */}
              <div className="flex items-center border border-primary/30 rounded-xl h-11 px-3 gap-4 bg-white dark:bg-transparent">
                <button
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                  className="material-symbols-outlined text-primary hover:opacity-80 active:scale-95 cursor-pointer bg-transparent border-0 outline-none text-base font-bold flex items-center justify-center"
                >
                  remove
                </button>
                <span className="text-xs font-black text-primary w-4 text-center select-none">{quantity}</span>
                <button
                  onClick={() => setQuantity(prev => prev + 1)}
                  className="material-symbols-outlined text-primary hover:opacity-80 active:scale-95 cursor-pointer bg-transparent border-0 outline-none text-base font-bold flex items-center justify-center"
                >
                  add
                </button>
              </div>

              {/* Add to Cart CTA */}
              <button
                onClick={addCustomizedToCart}
                className="flex-1 h-11 bg-primary hover:bg-primary-hover text-white font-extrabold rounded-xl text-xs uppercase cursor-pointer border-0 shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>Add Item</span>
                <span className="opacity-50">|</span>
                <span>₹{calculateTotalPrice()}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delivery Map Modal Selector */}
      <DeliveryMapModal
        show={showMapModal}
        onClose={() => setShowMapModal(false)}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={(addr) => {
          setDeliveryAddress(addr)
          setLocationName(addr)
        }}
        setActiveService={setActiveService}
        triggerToast={triggerToast}
        isDarkMode={isDarkMode}
      />

      {/* Delivery or Collection Selection Modal */}
      <DeliveryOrCollectionModal
        show={showServiceSelector}
        onClose={() => {
          setShowServiceSelector(false)
          if (isModalOpen) closeLocationModal()
        }}
        onSelect={(id) => {
          if (id === "delivery") {
            if (!deliveryAddress) {
              setDeliveryAddress("Joshi Colony, Bk Sindhi Colony, Indore, Indore")
            }
            setShowMapModal(true)
          } else if (id === "takeaway") {
            setShowStoreModal(true)
          } else if (id === "incar") {
            setShowCarModal(true)
          } else if (id === "train") {
            navigate("/user/deliver-on-train")
          }
        }}
        isDarkMode={isDarkMode}
      />

      {/* Takeaway Store Finder Modal */}
      {showStoreModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm dark">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6 space-y-4 text-left bg-[#131313] border border-white/10">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-lg-mobile text-lg text-white">Find your nearest hut</h3>
              <button
                onClick={() => setShowStoreModal(false)}
                className="material-symbols-outlined text-white/50 hover:text-white cursor-pointer bg-transparent border-0 outline-none"
              >
                close
              </button>
            </div>
            <p className="text-xs opacity-60 leading-relaxed text-white">
              We suggested the following Pizza Veg Huts near your coordinates:
            </p>

            {/* Store List Options */}
            <div className="space-y-3">
              {[
                { id: "hut-cp", name: "Pizza Veg Hut - Connaught Place", dist: "0.8 km", status: "Open Now", hours: "11 AM - 11 PM" },
                { id: "hut-kb", name: "Pizza Veg Hut - Karol Bagh", dist: "2.1 km", status: "Open Now", hours: "11 AM - 11 PM" },
                { id: "hut-sk", name: "Pizza Veg Hut - Saket Terminal", dist: "4.5 km", status: "Closed", hours: "Opens tomorrow" }
              ].map((store) => (
                <div
                  key={store.id}
                  onClick={() => {
                    setTakeawayHut(store.name)
                    setLocationName(store.name)
                    confirmLocation({
                      address: store.name,
                      serviceType: "takeaway"
                    })
                    setShowStoreModal(false)
                    triggerToast(`Selected outlet: ${store.name}`)
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                >
                  <div className="text-left space-y-1">
                    <h4 className="text-xs font-bold text-white leading-tight">{store.name}</h4>
                    <div className="flex gap-2 text-[9px] font-bold">
                      <span className="text-[#00C853]">{store.status}</span>
                      <span className="opacity-50">•</span>
                      <span className="opacity-60">{store.hours}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-[10px] bg-[#E53935]/10 text-[#E53935] px-2 py-0.5 rounded font-black tracking-wide">{store.dist}</span>
                    <span className="material-symbols-outlined text-xs text-white/40">arrow_forward_ios</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* In-Car Details Modal */}
      {showCarModal && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm dark">
          <div className="w-full max-w-sm glass-card rounded-3xl p-6 space-y-4 text-left bg-[#131313] border border-white/10">
            <div className="flex justify-between items-center">
              <h3 className="font-headline-lg-mobile text-lg text-white">In-Car Dining</h3>
              <button
                onClick={() => setShowCarModal(false)}
                className="material-symbols-outlined text-white/50 hover:text-white cursor-pointer bg-transparent border-0 outline-none"
              >
                close
              </button>
            </div>
            <p className="text-xs opacity-60 leading-relaxed text-white">
              Please enter your car number or vehicle registration details so we can deliver your hot pizza straight to your window:
            </p>

            {/* Input field */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase opacity-50 font-bold tracking-wider text-white">Car Number</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. DL 3C AB 1234"
                  value={carNumber}
                  onChange={(e) => setCarNumber(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                  directions_car
                </span>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={() => {
                const cleanCar = carNumber.trim()
                if (!cleanCar) {
                  triggerToast("Please enter a valid car number")
                  return
                }
                setCarNumber(cleanCar)
                setLocationName(cleanCar)
                confirmLocation({
                  address: cleanCar,
                  serviceType: "incar"
                })
                setShowCarModal(false)
                triggerToast("Car details confirmed!")
              }}
              className="w-full h-11 bg-[#E53935] text-on-primary font-bold rounded-xl text-xs uppercase cursor-pointer border-0 shadow-lg active:scale-95 transition-all"
            >
              Confirm Vehicle
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Cart basket FAB */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 w-full max-w-md pointer-events-none z-45">
          <button
            onClick={() => {
              navigate("/user/cart")
            }}
            className="absolute right-4 bottom-0 pointer-events-auto w-14 h-14 bg-primary text-on-primary rounded-full shadow-[0_0_20px_rgba(229,57,53,0.4)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-[28px]">shopping_basket</span>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white text-on-primary-container rounded-full text-[10px] font-bold flex items-center justify-center border border-primary animate-bounce">
              {totalCartCount}
            </div>
          </button>
        </div>
      )}
      </div>
    </div>
  )
}
