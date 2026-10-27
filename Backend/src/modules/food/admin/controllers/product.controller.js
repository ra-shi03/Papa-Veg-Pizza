import { priceMenuForStore } from '../../orders/services/menu-store-pricing.service.js';
import { Product } from '../models/product.model.js';
import { Addon } from '../models/addon.model.js';
import { FoodFranchise } from '../../franchise/models/franchise.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { CategoryProduct } from '../models/categoryProduct.model.js';
import mongoose from 'mongoose';

export async function getProducts(req, res, next) {
    try {
        const { page, limit, search, category, status } = req.query;

        const filter = {};
        if (search && search.trim()) {
            filter.name = { $regex: search.trim(), $options: 'i' };
        }
        if (status && status !== 'All') {
            filter.status = status;
        }
        if (category && category !== 'All' && category !== 'All Categories') {
            if (mongoose.Types.ObjectId.isValid(category)) {
                filter.categoryId = category;
            } else {
                const matchingCats = await CategoryProduct.find({ 
                    $or: [
                        { label: { $regex: category.trim(), $options: 'i' } },
                        { name: { $regex: category.trim(), $options: 'i' } }
                    ]
                }).select('_id');
                if (matchingCats.length > 0) {
                    filter.categoryId = { $in: matchingCats.map(c => c._id) };
                }
            }
        }

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        if (pageNum && limitNum) {
            const totalCount = await Product.countDocuments(filter);
            const totalPages = Math.max(1, Math.ceil(totalCount / limitNum));
            const skip = (pageNum - 1) * limitNum;

            const products = await Product.find(filter)
                .populate('categoryId', 'label name badge icon sort')
                .populate('toppings')
                .populate('crusts')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum);

            return res.status(200).json({
                success: true,
                data: products,
                pagination: {
                    totalCount,
                    totalPages,
                    currentPage: pageNum,
                    limit: limitNum
                }
            });
        }

        const products = await Product.find(filter)
            .populate('categoryId', 'label name badge icon sort')
            .populate('toppings')
            .populate('crusts')
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, data: products, totalCount: products.length });
    } catch (error) {
        next(error);
    }
}

export async function getProductStats(req, res, next) {
    try {
        const { search, category, status } = req.query;

        const filter = {};
        if (search && search.trim()) {
            filter.name = { $regex: search.trim(), $options: 'i' };
        }
        if (status && status !== 'All') {
            filter.status = status;
        }
        if (category && category !== 'All' && category !== 'All Categories') {
            if (mongoose.Types.ObjectId.isValid(category)) {
                filter.categoryId = category;
            } else {
                const matchingCats = await CategoryProduct.find({ 
                    $or: [
                        { label: { $regex: category.trim(), $options: 'i' } },
                        { name: { $regex: category.trim(), $options: 'i' } }
                    ]
                }).select('_id');
                if (matchingCats.length > 0) {
                    filter.categoryId = { $in: matchingCats.map(c => c._id) };
                }
            }
        }

        const totalProducts = await Product.countDocuments(filter);
        const activeProducts = await Product.countDocuments({ ...filter, status: { $regex: /^active$/i } });
        const draftProducts = await Product.countDocuments({ ...filter, status: { $regex: /^draft$/i } });
        const archivedProducts = await Product.countDocuments({ ...filter, status: { $regex: /^archived$/i } });
        const vegProducts = await Product.countDocuments({ ...filter, vegType: { $regex: /^veg/i } });
        const customizableProducts = await Product.countDocuments({
            ...filter,
            $or: [
                { 'sizes.1': { $exists: true } },
                { 'toppings.0': { $exists: true } },
                { isCustomizable: true }
            ]
        });
        const outOfStockProducts = await Product.countDocuments({
            ...filter,
            $or: [
                { availability: { $regex: /out of stock/i } },
                { status: { $regex: /out of stock/i } }
            ]
        });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const addedThisMonth = await Product.countDocuments({ ...filter, createdAt: { $gte: startOfMonth } });

        res.status(200).json({
            success: true,
            data: {
                totalProducts,
                activeProducts,
                draftProducts,
                archivedProducts,
                vegProducts,
                customizableProducts,
                outOfStockProducts,
                addedThisMonth
            }
        });
    } catch (error) {
        next(error);
    }
}

export async function getPublicProducts(req, res, next) {
    try {
        const { category, search } = req.query;

        const filter = { status: { $regex: /^active$/i } };
        if (search && search.trim()) {
            filter.name = { $regex: search.trim(), $options: 'i' };
        }
        if (category && category !== 'All' && category !== 'All Categories') {
            if (mongoose.Types.ObjectId.isValid(category)) {
                filter.categoryId = category;
            } else {
                const matchingCats = await CategoryProduct.find({ 
                    $or: [
                        { label: { $regex: category.trim(), $options: 'i' } },
                        { name: { $regex: category.trim(), $options: 'i' } }
                    ]
                }).select('_id');
                if (matchingCats.length > 0) {
                    filter.categoryId = { $in: matchingCats.map(c => c._id) };
                }
            }
        }

        const products = await Product.find(filter)
            .populate('categoryId', 'label name badge icon sort')
            .populate('toppings')
            .populate('crusts')
            .sort({ createdAt: -1 });

        const priced = await priceMenuForStore(products, req.query);
        res.status(200).json({ success: true, data: priced, totalCount: priced.length });
    } catch (error) {
        next(error);
    }
}

export async function getPublicMenu(req, res, next) {
    try {
        const categories = await CategoryProduct.find({ status: { $ne: 'Inactive' } }).sort({ sort: 1, createdAt: 1 });
        const products = await Product.find({ status: { $regex: /^active$/i } })
            .populate('categoryId', 'label name badge icon sort')
            .populate('toppings')
            .populate('crusts')
            .sort({ createdAt: -1 });

        res.status(200).json({ 
            success: true, 
            data: {
                categories,
                products: await priceMenuForStore(products, req.query)
            } 
        });
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
            .populate('toppings')
            .populate('crusts')
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
