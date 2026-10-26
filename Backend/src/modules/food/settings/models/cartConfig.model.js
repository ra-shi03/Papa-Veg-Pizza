import mongoose from 'mongoose';

const objectIdList = () => [{ type: mongoose.Schema.Types.ObjectId }];

const cartConfigSchema = new mongoose.Schema({
    // Bottom bar shown on the menu after the first item is added
    bottomBar: {
        enabled: { type: Boolean, default: true },
        showUpsell: { type: Boolean, default: true },
        ctaText: { type: String, default: 'View Cart' },
        freeDeliveryText: { type: String, default: '' }
    },

    // "Complete your order" suggestions (menu bottom bar + cart page)
    upsell: {
        enabled: { type: Boolean, default: true },
        title: { type: String, default: 'Complete your order now' },
        cartTitle: { type: String, default: 'Complete Your Meal With' },
        // auto: rules + order history. manual: only the items the superadmin hand-picked (pinned lists).
        mode: { type: String, enum: ['auto', 'manual'], default: 'auto' },
        // Which catalogues feed the suggestions
        includeProducts: { type: Boolean, default: true },
        includeAddons: { type: Boolean, default: true },
        includeToppings: { type: Boolean, default: true },
        productCategoryIds: objectIdList(),
        addonTypes: [{ type: String, trim: true }],
        pinnedProductIds: objectIdList(),
        pinnedAddonIds: objectIdList(),
        excludeProductIds: objectIdList(),
        excludeAddonIds: objectIdList(),
        maxItems: { type: Number, default: 8, min: 1, max: 30 },
        hideItemsInCart: { type: Boolean, default: true },
        showCategoryChips: { type: Boolean, default: true },
        // Returning customers get "frequently bought together" ranking from past orders
        frequentlyBoughtEnabled: { type: Boolean, default: true },
        minPastOrders: { type: Number, default: 1, min: 1 }
    },

    // Limited time offer behind the "Slide to unlock" bar on the cart page
    offer: {
        enabled: { type: Boolean, default: false },
        sliderText: { type: String, default: 'Slide to unlock Limited Time Offer' },
        modalTitle: { type: String, default: 'Limited Time Discount for you!' },
        buttonText: { type: String, default: 'Add & Continue' },
        itemType: { type: String, enum: ['product', 'addon'], default: 'addon' },
        productId: { type: mongoose.Schema.Types.ObjectId, default: null },
        addonId: { type: mongoose.Schema.Types.ObjectId, default: null },
        sizeName: { type: String, default: '' },
        offerPrice: { type: Number, default: 0, min: 0 },
        expiryMinutes: { type: Number, default: 15, min: 1, max: 240 },
        minCartValue: { type: Number, default: 0, min: 0 }
    }
}, { timestamps: true });

export const CartConfig = mongoose.model('CartConfig', cartConfigSchema);
