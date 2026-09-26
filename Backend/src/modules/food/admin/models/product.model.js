import mongoose from 'mongoose';

const productSizeSchema = new mongoose.Schema(
    {
        size: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        description: { type: String, trim: true, default: '' }
    },
    { _id: true }
);

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, index: true },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoryProduct', required: true, index: true },
        sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductSection', required: true, index: true },
        shortDescription: { type: String, trim: true, default: '' },
        description: { type: String, trim: true, default: '' },
        image: { type: String, trim: true, default: '' },
        price: { type: Number, default: 0, min: 0 },
        status: { type: String, enum: ['Active', 'Draft', 'Archived'], default: 'Active', index: true },
        franchiseIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodFranchise' }],
        storeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'FoodStore' }],
        toppings: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Addon' }],
        sizes: { type: [productSizeSchema], default: [] },
        vegType: { type: String, enum: ['veg', 'non-veg', 'vegan'], default: 'veg' }
    },
    {
        collection: 'products',
        timestamps: true
    }
);

productSchema.index({ categoryId: 1, sectionId: 1 });
productSchema.index({ status: 1, createdAt: -1 });

export const Product = mongoose.model('Product', productSchema);
