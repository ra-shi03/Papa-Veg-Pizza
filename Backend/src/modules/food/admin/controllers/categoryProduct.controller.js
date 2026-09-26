import { CategoryProduct } from '../models/categoryProduct.model.js';

export const getCategoryProducts = async (req, res) => {
  try {
    const categoryProducts = await CategoryProduct.find().sort({ createdAt: 1 });
    res.json({ success: true, data: categoryProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryProductById = async (req, res) => {
  try {
    const categoryProduct = await CategoryProduct.findById(req.params.id);
    if (!categoryProduct) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: categoryProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategoryProduct = async (req, res) => {
  try {
    const categoryProduct = new CategoryProduct(req.body);
    await categoryProduct.save();
    res.status(201).json({ success: true, data: categoryProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCategoryProduct = async (req, res) => {
  try {
    const categoryProduct = await CategoryProduct.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!categoryProduct) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: categoryProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteCategoryProduct = async (req, res) => {
  try {
    const categoryProduct = await CategoryProduct.findByIdAndDelete(req.params.id);
    if (!categoryProduct) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
