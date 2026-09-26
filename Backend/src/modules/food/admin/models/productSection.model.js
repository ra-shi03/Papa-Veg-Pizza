import mongoose from 'mongoose';

const productSectionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true, index: true },
        slug: { type: String, required: true, trim: true, unique: true, index: true },
        categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'CategoryProduct', required: true, index: true },
        status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
        sortOrder: { type: Number, default: 0 }
    },
    {
        collection: 'product_sections',
        timestamps: true
    }
);

// Pre-save to auto-generate slug if not provided
productSectionSchema.pre('validate', function (next) {
    if (this.name && !this.slug) {
        this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    }
    next();
});

export const ProductSection = mongoose.model('ProductSection', productSectionSchema);
