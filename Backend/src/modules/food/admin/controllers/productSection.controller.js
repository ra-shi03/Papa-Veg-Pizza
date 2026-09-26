import { ProductSection } from '../models/productSection.model.js';

export const getSections = async (req, res) => {
  try {
    const filter = {};
    if (req.query.categoryId) {
      filter.categoryId = req.query.categoryId;
    }
    const sections = await ProductSection.find(filter).sort({ sortOrder: 1, createdAt: -1 }).populate('categoryId', 'label');
    res.json({ success: true, data: sections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSectionById = async (req, res) => {
  try {
    const section = await ProductSection.findById(req.params.id).populate('categoryId', 'label');
    if (!section) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: section });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSection = async (req, res) => {
  try {
    const section = new ProductSection(req.body);
    await section.save();
    res.status(201).json({ success: true, data: section });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateSection = async (req, res) => {
  try {
    const section = await ProductSection.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!section) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: section });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const section = await ProductSection.findByIdAndDelete(req.params.id);
    if (!section) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
