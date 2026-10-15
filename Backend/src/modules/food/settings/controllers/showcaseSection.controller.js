import { ShowcaseSection } from '../models/showcaseSection.model.js';
import { Product } from '../../admin/models/product.model.js';
import mongoose from 'mongoose';

// Title Case Helper: First letter Uppercase, rest lowercase in each word
export function toTitleCase(str) {
    if (!str || typeof str !== 'string') return '';
    return str
        .toLowerCase()
        .replace(/\b[a-z]/g, char => char.toUpperCase())
        .replace(/_([a-z])/g, (_, c) => '_' + c.toUpperCase())
        .replace(/'[A-Z]\b/g, char => char.toLowerCase());
}

// Initial seed sections matching Domino's style references (Paneer Maxxx, 6 in 1, Combo Bonanza)
const DEFAULT_SECTIONS = [
    {
        name: 'Paneer Maxxx',
        title: 'In 3 exciting flavours',
        subtitle: 'The ultimate loaded Paneer feast!',
        badgeText: 'Paneer Maxxx',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png',
        bgStyle: 'default',
        isActive: true,
        sortOrder: 1,
        products: [
            {
                customTitle: 'Paneer Maxxx Makhani Fusion',
                customDescription: 'Toppings (2): Paneer • Crisp Capsicum',
                customPrice: 299,
                customOriginalPrice: 349,
                customSaveText: 'Save ₹50',
                sizeCrustText: 'Regular | New Hand Tossed >',
                buttonText: 'Add +',
                badge: 'Hot Seller',
                vegType: 'veg',
                customImage: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=60'
            },
            {
                customTitle: 'Paneer Maxxx Fiery Peri Peri',
                customDescription: 'Toppings (2): Spicy Paneer • Red Paprika',
                customPrice: 319,
                customOriginalPrice: 369,
                customSaveText: 'Save ₹50',
                sizeCrustText: 'Regular | Cheese Burst >',
                buttonText: 'Add +',
                badge: 'Spicy',
                vegType: 'veg',
                customImage: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=60'
            },
            {
                customTitle: 'Paneer Maxxx Tandoori Delight',
                customDescription: 'Toppings (3): Tandoori Paneer • Onion • Capsicum',
                customPrice: 339,
                customOriginalPrice: 389,
                customSaveText: 'Save ₹50',
                sizeCrustText: 'Regular | Wheat Thin Crust >',
                buttonText: 'Add +',
                badge: 'Chef Special',
                vegType: 'veg',
                customImage: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&auto=format&fit=crop&q=60'
            }
        ]
    },
    {
        name: '6 in 1 Big Big Pizza',
        title: 'Big Big Pizza',
        subtitle: 'In 4 Exciting Flavours',
        badgeText: '6 in 1',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/1404/1404945.png',
        bgStyle: 'warm_cream',
        isActive: true,
        sortOrder: 2,
        products: [
            {
                customTitle: 'Big Big 6in1 Cheeseburst - Veg',
                customDescription: 'Big Big Pizza meets iconic Cheeseburst crust, bursting with gooey molten cheese and 6 bestseller veg flavours.',
                customPrice: 999,
                customOriginalPrice: 2149,
                customSaveText: 'Save ₹1,150',
                sizeCrustText: 'Large Plus | Cheese Burst >',
                buttonText: 'Add +',
                badge: 'Bestseller',
                vegType: 'veg',
                customImage: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=60'
            },
            {
                customTitle: 'Big Big 6in1 Gourmet Feast',
                customDescription: 'Loaded with paneer, sweet corn, black olives, jalapenos, mushrooms, and golden bell peppers.',
                customPrice: 1049,
                customOriginalPrice: 2299,
                customSaveText: 'Save ₹1,250',
                sizeCrustText: 'Large Plus | Cheese Burst >',
                buttonText: 'Add +',
                badge: 'Mega Feast',
                vegType: 'veg',
                customImage: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&auto=format&fit=crop&q=60'
            }
        ]
    },
    {
        name: 'Combo Bonanza',
        title: 'Super Savings Combos',
        subtitle: 'Feast with your family & friends',
        badgeText: 'Combo Bonanza',
        logoUrl: 'https://cdn-icons-png.flaticon.com/512/3480/3480823.png',
        bgStyle: 'festive_blue',
        isActive: true,
        sortOrder: 3,
        products: [
            {
                customTitle: 'Ultimate Pizza Feast',
                customDescription: '1 Regular Pizza • 1 Side • 1 Dip / Beverage / Dessert',
                customPrice: 335,
                customOriginalPrice: 419,
                customSaveText: 'Save ₹84',
                badge: 'Serves 1',
                sizeCrustText: 'Serves 1 Person',
                buttonText: 'Build your Combo >',
                vegType: 'veg',
                customImage: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=800&auto=format&fit=crop&q=60'
            },
            {
                customTitle: 'Family Party Combo',
                customDescription: '2 Medium Pizzas • Stuffed Garlic Bread • 2 Pepsi Cans',
                customPrice: 699,
                customOriginalPrice: 999,
                customSaveText: 'Save ₹300',
                badge: 'Serves 4',
                sizeCrustText: 'Serves 3-4 People',
                buttonText: 'Build your Combo >',
                vegType: 'veg',
                customImage: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&auto=format&fit=crop&q=60'
            }
        ]
    }
];

// Helper to seed default sections if collection is empty
async function seedDefaultSectionsIfNeeded() {
    try {
        const count = await ShowcaseSection.countDocuments();
        if (count === 0) {
            // Try to link real products from database if available
            const realProducts = await Product.find({ status: 'Active' }).limit(6).lean();
            const sectionsToSeed = JSON.parse(JSON.stringify(DEFAULT_SECTIONS));
            
            if (realProducts.length > 0) {
                // Link real products where possible
                sectionsToSeed.forEach((sec, sIdx) => {
                    sec.products.forEach((p, pIdx) => {
                        const matchedProduct = realProducts[(sIdx + pIdx) % realProducts.length];
                        if (matchedProduct) {
                            p.product = matchedProduct._id;
                        }
                    });
                });
            }
            
            await ShowcaseSection.insertMany(sectionsToSeed);
        }
    } catch (err) {
        console.error('Error seeding default showcase sections:', err);
    }
}

// GET /api/v1/settings/showcase-sections (Public for User App)
export async function getPublicShowcaseSections(req, res) {
    try {
        await seedDefaultSectionsIfNeeded();

        let sections = await ShowcaseSection.find({ isActive: true })
            .sort({ sortOrder: 1, createdAt: 1 })
            .populate({
                path: 'products.product',
                select: 'name price originalPrice image description shortDescription vegType sizes status inStock'
            })
            .lean();

        if (!sections || sections.length === 0) {
            sections = await ShowcaseSection.find()
                .sort({ sortOrder: 1, createdAt: 1 })
                .populate({
                    path: 'products.product',
                    select: 'name price originalPrice image description shortDescription vegType sizes status inStock'
                })
                .lean();
        }

        if (!sections || sections.length === 0) {
            sections = JSON.parse(JSON.stringify(DEFAULT_SECTIONS));
        }

        // Format and merge product details with custom overrides
        const formattedSections = sections.map(section => {
            const formattedProducts = (section.products || []).map(item => {
                const prod = item.product || {};
                return {
                    _id: item._id,
                    productId: prod._id || null,
                    title: toTitleCase(item.customTitle || prod.name || 'Delicious Pizza'),
                    description: toTitleCase(item.customDescription || prod.shortDescription || prod.description || ''),
                    image: item.customImage || prod.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=60',
                    price: item.customPrice || prod.price || 0,
                    originalPrice: item.customOriginalPrice || prod.originalPrice || 0,
                    saveText: toTitleCase(item.customSaveText || ''),
                    sizeCrustText: toTitleCase((item.sizeCrustText || 'Regular | New Hand Tossed').replace(/\s*>\s*$/, '')),
                    buttonText: toTitleCase(item.buttonText || 'Add +'),
                    badge: toTitleCase(item.badge || prod.badge || ''),
                    vegType: item.vegType || prod.vegType || 'veg',
                    sizes: prod.sizes || [],
                    rawProduct: prod
                };
            });

            return {
                ...section,
                bgStyle: section.bgStyle || 'brand_red',
                bgColor: section.bgColor || '',
                name: toTitleCase(section.name || section.title),
                title: toTitleCase(section.title),
                subtitle: toTitleCase(section.subtitle || ''),
                badgeText: toTitleCase(section.badgeText || ''),
                products: formattedProducts
            };
        });

        return res.status(200).json({
            success: true,
            data: formattedSections
        });
    } catch (error) {
        console.error('Error in getPublicShowcaseSections:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch showcase sections',
            error: error.message
        });
    }
}

// GET /api/v1/settings/showcase-sections/admin (Protected for Superadmin)
export async function getAllShowcaseSectionsAdmin(req, res) {
    try {
        await seedDefaultSectionsIfNeeded();

        const sections = await ShowcaseSection.find()
            .sort({ sortOrder: 1, createdAt: 1 })
            .populate({
                path: 'products.product',
                select: 'name price originalPrice image description shortDescription vegType sizes status'
            })
            .lean();

        const formattedSections = sections.map(section => ({
            ...section,
            bgStyle: section.bgStyle || 'brand_red',
            bgColor: section.bgColor || '',
            name: toTitleCase(section.name || section.title),
            title: toTitleCase(section.title),
            subtitle: toTitleCase(section.subtitle || ''),
            badgeText: toTitleCase(section.badgeText || ''),
            products: (section.products || []).map(p => ({
                ...p,
                customTitle: toTitleCase(p.customTitle || p.product?.name || ''),
                customDescription: toTitleCase(p.customDescription || p.product?.shortDescription || p.product?.description || ''),
                badge: toTitleCase(p.badge || p.product?.badge || ''),
                sizeCrustText: toTitleCase((p.sizeCrustText || 'Regular | New Hand Tossed').replace(/\s*>\s*$/, '')),
                buttonText: toTitleCase(p.buttonText || 'Add +'),
                customSaveText: toTitleCase(p.customSaveText || '')
            }))
        }));

        return res.status(200).json({
            success: true,
            data: formattedSections
        });
    } catch (error) {
        console.error('Error in getAllShowcaseSectionsAdmin:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch showcase sections for admin',
            error: error.message
        });
    }
}

// GET /api/v1/settings/showcase-sections/:id
export async function getShowcaseSectionById(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid section ID' });
        }

        const section = await ShowcaseSection.findById(id).populate('products.product');
        if (!section) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        return res.status(200).json({ success: true, data: section });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// POST /api/v1/settings/showcase-sections
export async function createShowcaseSection(req, res) {
    try {
        const { name, title, subtitle, logoUrl, badgeText, bgStyle, bgColor, isActive, sortOrder, products } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ success: false, message: 'Section title is required' });
        }

        const highestOrderDoc = await ShowcaseSection.findOne().sort({ sortOrder: -1 }).select('sortOrder');
        const nextOrder = (highestOrderDoc && typeof highestOrderDoc.sortOrder === 'number') 
            ? highestOrderDoc.sortOrder + 1 
            : 0;

        const formattedProducts = (Array.isArray(products) ? products : []).map((p, idx) => ({
            product: (p.product && mongoose.Types.ObjectId.isValid(p.product)) ? p.product : undefined,
            customTitle: toTitleCase(p.customTitle || p.title || ''),
            customDescription: toTitleCase(p.customDescription || p.description || ''),
            customImage: p.customImage || p.image || '',
            customPrice: Number(p.customPrice || p.price || 0),
            customOriginalPrice: Number(p.customOriginalPrice || p.originalPrice || 0),
            customSaveText: toTitleCase(p.customSaveText || p.saveText || ''),
            sizeCrustText: toTitleCase((p.sizeCrustText || 'Regular | New Hand Tossed').replace(/\s*>\s*$/, '')),
            buttonText: toTitleCase(p.buttonText || 'Add +'),
            badge: toTitleCase(p.badge || ''),
            vegType: ['veg', 'non-veg', 'vegan'].includes(p.vegType) ? p.vegType : 'veg',
            sortOrder: idx
        }));

        const section = new ShowcaseSection({
            name: toTitleCase(name || title),
            title: toTitleCase(title),
            subtitle: toTitleCase(subtitle || ''),
            logoUrl: logoUrl || '',
            badgeText: toTitleCase(badgeText || ''),
            bgStyle: bgStyle || 'brand_red',
            bgColor: typeof bgColor === 'string' ? bgColor.trim() : '',
            isActive: isActive !== undefined ? isActive : true,
            sortOrder: sortOrder !== undefined ? Number(sortOrder) : nextOrder,
            products: formattedProducts
        });

        await section.save();

        const populated = await ShowcaseSection.findById(section._id).populate('products.product');

        return res.status(201).json({
            success: true,
            message: 'Showcase section created successfully',
            data: populated
        });
    } catch (error) {
        console.error('Error in createShowcaseSection:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// PUT /api/v1/settings/showcase-sections/:id
export async function updateShowcaseSection(req, res) {
    try {
        const { id } = req.params;
        const { name, title, subtitle, logoUrl, badgeText, bgStyle, bgColor, isActive, sortOrder, products } = req.body;

        let section = null;
        if (mongoose.Types.ObjectId.isValid(id)) {
            section = await ShowcaseSection.findById(id);
        }

        // If not found by ObjectId, search by name, title, or badgeText
        if (!section) {
            const candidates = [name, title, badgeText, id].filter(Boolean);
            for (const candidate of candidates) {
                const escaped = String(candidate).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                section = await ShowcaseSection.findOne({
                    $or: [
                        { name: new RegExp(`^${escaped}$`, 'i') },
                        { title: new RegExp(`^${escaped}$`, 'i') },
                        { badgeText: new RegExp(`^${escaped}$`, 'i') }
                    ]
                });
                if (section) break;
            }
        }

        // If still not found, create a new ShowcaseSection document
        if (!section) {
            const highestDoc = await ShowcaseSection.findOne().sort({ sortOrder: -1 }).select('sortOrder');
            const nextOrder = (highestDoc && typeof highestDoc.sortOrder === 'number') ? highestDoc.sortOrder + 1 : 0;
            section = new ShowcaseSection({
                name: toTitleCase(name || title || id),
                title: toTitleCase(title || name || id),
                subtitle: toTitleCase(subtitle || ''),
                logoUrl: logoUrl || '',
                badgeText: toTitleCase(badgeText || ''),
                bgStyle: bgStyle || 'brand_red',
                bgColor: typeof bgColor === 'string' ? bgColor.trim() : '',
                isActive: isActive !== undefined ? isActive : true,
                sortOrder: sortOrder !== undefined ? Number(sortOrder) : nextOrder,
                products: []
            });
        }

        // Apply fields to update
        if (name !== undefined) section.name = toTitleCase(name);
        if (title !== undefined) section.title = toTitleCase(title);
        if (subtitle !== undefined) section.subtitle = toTitleCase(subtitle);
        if (logoUrl !== undefined) section.logoUrl = logoUrl;
        if (badgeText !== undefined) section.badgeText = toTitleCase(badgeText);
        if (bgStyle !== undefined) section.bgStyle = bgStyle || 'brand_red';
        if (bgColor !== undefined) section.bgColor = typeof bgColor === 'string' ? bgColor.trim() : '';
        if (isActive !== undefined) section.isActive = isActive;
        if (sortOrder !== undefined) section.sortOrder = Number(sortOrder);

        if (Array.isArray(products)) {
            section.products = products.map((p, idx) => ({
                product: (p.product && mongoose.Types.ObjectId.isValid(p.product)) ? p.product : undefined,
                customTitle: toTitleCase(p.customTitle || p.title || ''),
                customDescription: toTitleCase(p.customDescription || p.description || ''),
                customImage: p.customImage || p.image || '',
                customPrice: Number(p.customPrice || p.price || 0),
                customOriginalPrice: Number(p.customOriginalPrice || p.originalPrice || 0),
                customSaveText: toTitleCase(p.customSaveText || p.saveText || ''),
                sizeCrustText: toTitleCase((p.sizeCrustText || 'Regular | New Hand Tossed').replace(/\s*>\s*$/, '')),
                buttonText: toTitleCase(p.buttonText || 'Add +'),
                badge: toTitleCase(p.badge || ''),
                vegType: ['veg', 'non-veg', 'vegan'].includes(p.vegType) ? p.vegType : 'veg',
                sortOrder: idx
            }));
        }

        await section.save();
        const populated = await ShowcaseSection.findById(section._id).populate('products.product');

        return res.status(200).json({
            success: true,
            message: 'Showcase section updated successfully',
            data: populated || section
        });
    } catch (error) {
        console.error('Error in updateShowcaseSection:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

// DELETE /api/v1/settings/showcase-sections/:id
export async function deleteShowcaseSection(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid section ID' });
        }

        const deleted = await ShowcaseSection.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        return res.status(200).json({
            success: true,
            message: 'Showcase section deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// PATCH /api/v1/settings/showcase-sections/:id/toggle
export async function toggleShowcaseSectionStatus(req, res) {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid section ID' });
        }

        const section = await ShowcaseSection.findById(id);
        if (!section) {
            return res.status(404).json({ success: false, message: 'Section not found' });
        }

        section.isActive = !section.isActive;
        await section.save();

        return res.status(200).json({
            success: true,
            message: `Section ${section.isActive ? 'activated' : 'deactivated'}`,
            data: { id: section._id, isActive: section.isActive }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

// PATCH /api/v1/settings/showcase-sections/reorder
export async function reorderShowcaseSections(req, res) {
    try {
        const { items } = req.body; // Array of { id, sortOrder }
        if (!Array.isArray(items)) {
            return res.status(400).json({ success: false, message: 'Items array is required' });
        }

        const bulkOps = items.map(item => ({
            updateOne: {
                filter: { _id: item.id },
                update: { $set: { sortOrder: Number(item.sortOrder) } }
            }
        }));

        if (bulkOps.length > 0) {
            await ShowcaseSection.bulkWrite(bulkOps);
        }

        return res.status(200).json({
            success: true,
            message: 'Sections reordered successfully'
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
}

