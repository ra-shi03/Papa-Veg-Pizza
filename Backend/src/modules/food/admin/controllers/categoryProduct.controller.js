import { CategoryProduct } from '../models/categoryProduct.model.js';

export const getCategoryProducts = async (req, res) => {
  try {
    const { sort, search } = req.query;
    
    let query = {};
    if (search) {
      query.label = { $regex: search, $options: 'i' };
    }

    let sortObj = { sort: 1, createdAt: 1 };
    if (sort === 'name_asc') sortObj = { label: 1 };
    else if (sort === 'name_desc') sortObj = { label: -1 };
    else if (sort === 'date_desc') sortObj = { createdAt: -1 };
    else if (sort === 'date_asc') sortObj = { createdAt: 1 };
    else if (sort === 'sort_asc') sortObj = { sort: 1, createdAt: 1 };
    else if (sort === 'sort_desc') sortObj = { sort: -1, createdAt: 1 };

    const categoryProducts = await CategoryProduct.find(query).sort(sortObj);
    res.json({ success: true, data: categoryProducts, categories: categoryProducts });
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
    if (req.body.sort !== undefined && req.body.sort !== null) {
      req.body.sort = Number(req.body.sort) || 0;
    }
    const categoryProduct = new CategoryProduct(req.body);
    await categoryProduct.save();
    res.status(201).json({ success: true, data: categoryProduct });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCategoryProduct = async (req, res) => {
  try {
    if (req.body.sort !== undefined && req.body.sort !== null) {
      req.body.sort = Number(req.body.sort) || 0;
    }
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

export const getCategoryStats = async (req, res) => {
  try {
    const totalCategories = await CategoryProduct.countDocuments();
    const activeCategories = await CategoryProduct.countDocuments({ status: { $regex: /^active$/i } });
    const inactiveCategories = await CategoryProduct.countDocuments({ status: { $regex: /^inactive$/i } });
    const badgedCategories = await CategoryProduct.countDocuments({ badge: { $exists: true, $ne: '' } });
    const withIconCategories = await CategoryProduct.countDocuments({ icon: { $exists: true, $ne: '' } });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const addedThisMonth = await CategoryProduct.countDocuments({ createdAt: { $gte: startOfMonth } });

    res.json({
      success: true,
      data: {
        totalCategories,
        activeCategories,
        inactiveCategories,
        badgedCategories,
        withIconCategories,
        addedThisMonth
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
