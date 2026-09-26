import { Product } from '../models/product.model.js';
import { Addon } from '../models/addon.model.js';
import { FoodFranchise } from '../../franchise/models/franchise.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import mongoose from 'mongoose';

export async function getProducts(req, res, next) {
    try {
        const products = await Product.find()
            .populate('categoryId', 'label')
            .populate('sectionId', 'name')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, data: products });
    } catch (error) {
        next(error);
    }
}

export async function getProductById(req, res, next) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, error: 'Invalid Product ID' });
        }
        const product = await Product.findById(req.params.id)
            .populate('categoryId', 'label')
            .populate('sectionId', 'name')
            .populate('toppings', 'name')
            .populate('franchiseIds', 'companyName name franchiseName')
            .populate('storeIds', 'name storeName');
        if (!product) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
}

export async function createProduct(req, res, next) {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json({ success: true, message: 'Product created successfully', data: product });
    } catch (error) {
        next(error);
    }
}

export async function updateProduct(req, res, next) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, error: 'Invalid Product ID' });
        }
        const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.status(200).json({ success: true, message: 'Product updated successfully', data: updated });
    } catch (error) {
        next(error);
    }
}

export async function deleteProduct(req, res, next) {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(404).json({ success: false, error: 'Invalid Product ID' });
        }
        const deleted = await Product.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, error: 'Product not found' });
        }
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        next(error);
    }
}
