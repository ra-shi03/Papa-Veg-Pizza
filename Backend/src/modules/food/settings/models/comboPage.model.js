import mongoose from 'mongoose';

const objectIdList = () => [{ type: mongoose.Schema.Types.ObjectId }];

const comboPageSchema = new mongoose.Schema({
    // Combo landing page (/user/combos)
    topBannerUrl: { type: String, default: '' },
    bottomBannerUrl: { type: String, default: '' },
    sectionTitle: { type: String, default: '1 PLUS 1 Offer' },
    sectionSubtitle: { type: String, default: 'Mind boggling offers on selecting any 2 pizzas' },
    buttonText: { type: String, default: 'Build your Combo' },
    isActive: { type: Boolean, default: true },

    // Combo builder (/user/combos/build)
    offerName: { type: String, default: '1 PLUS 1 Offer' },
    slotCount: { type: Number, default: 2, min: 1, max: 6 },
    sizeName: { type: String, default: 'Medium' },
    eligibleCategoryIds: objectIdList(),
    eligibleProductIds: objectIdList(),
    defaultProductIds: objectIdList(),
    // Per-pizza combo discounts (override the default below), like Domino's tiered offers
    productDiscounts: [{
        _id: false,
        productId: { type: mongoose.Schema.Types.ObjectId, required: true },
        discountType: { type: String, enum: ['percentage', 'flat'], default: 'flat' },
        discountValue: { type: Number, default: 0, min: 0 }
    }],
    // Default combo discount for pizzas without their own rule
    discountType: { type: String, enum: ['percentage', 'flat'], default: 'flat' },
    discountValue: { type: Number, default: 0, min: 0 },
    loadingSeconds: { type: Number, default: 3, min: 1, max: 10 },
    loadingTitle: { type: String, default: 'Building a perfect meal for you!' },
    loadingSubtitle: { type: String, default: 'You can change anytime' },
    includesTitle: { type: String, default: 'Combo includes {count} items' },
    changeNotice: { type: String, default: 'Feel free to change your combo items anytime!' },
    exploreText: { type: String, default: 'Explore more pizzas & grab up to {maxSave} Off!' },
    pickerTitle: { type: String, default: 'Select a {size} Pizza' },
    // Picker toolbar toggles
    showVegFilter: { type: Boolean, default: true },
    showNonVegFilter: { type: Boolean, default: true },
    showSort: { type: Boolean, default: true },
    addButtonText: { type: String, default: 'Add Combo' }
}, { timestamps: true });

export const ComboPage = mongoose.model('ComboPage', comboPageSchema);
