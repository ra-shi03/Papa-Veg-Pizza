import { AddonType } from '../models/addonType.model.js';
import { Addon } from '../models/addon.model.js';
import { Product } from '../models/product.model.js';
import { sendError, sendResponse } from '../../../../utils/response.js';

const DEFAULT_TYPES = [
  {
    name: 'Crust',
    slug: 'crust',
    description: 'Pizza crust choices including New Hand Tossed, Pan, and Thin Crusts',
    icon: 'Disc',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30',
    status: 'Active',
    sortOrder: 1,
    isDefault: true
  },
  {
    name: 'Toppings',
    slug: 'topping',
    description: 'Fresh vegetable and gourmet toppings like Capsicum, Paneer, Mushroom',
    icon: 'Sparkles',
    color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30',
    status: 'Active',
    sortOrder: 2,
    isDefault: false
  },
  {
    name: 'Dips',
    slug: 'dip',
    description: 'Flavorful dips and sauces like Cheesy Dip, Garlic, and Mayo',
    icon: 'Droplets',
    color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/30',
    status: 'Active',
    sortOrder: 3,
    isDefault: false
  },
  {
    name: 'Cheese',
    slug: 'cheese',
    description: 'Extra cheese toppings and melted liquid cheese blends',
    icon: 'Flame',
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30',
    status: 'Active',
    sortOrder: 4,
    isDefault: false
  },
  {
    name: 'Burst',
    slug: 'burst',
    description: 'Specialty crust and seasoning bursts like Chinese Chilli or Mint',
    icon: 'Layers',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30',
    status: 'Active',
    sortOrder: 5,
    isDefault: false
  }
];

export const getAddonTypes = async (req, res) => {
  try {
    let count = await AddonType.countDocuments();
    if (count === 0) {
      try {
        await AddonType.insertMany(DEFAULT_TYPES);
      } catch (err) {
        console.error('Error seeding default addon types:', err);
      }
    }

    const { status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const types = await AddonType.find(filter).sort({ sortOrder: 1, createdAt: 1 }).lean();

    // Fetch addons and products to compute real-time statistics for each type
    const [allAddons, allProducts] = await Promise.all([
      Addon.find().lean(),
      Product.find().select('toppings crusts').lean()
    ]);

    // Map addon id to connected product count
    const addonUsageMap = {};
    allProducts.forEach(prod => {
      (prod.toppings || []).forEach(tId => {
        const strId = String(tId);
        addonUsageMap[strId] = (addonUsageMap[strId] || 0) + 1;
      });
      (prod.crusts || []).forEach(cId => {
        const strId = String(cId);
        addonUsageMap[strId] = (addonUsageMap[strId] || 0) + 1;
      });
    });

    // Compute stats per type
    const enrichedTypes = types.map(t => {
      const typeSlug = (t.slug || t.name).toLowerCase();
      const typeName = t.name.toLowerCase();

      // Find addons matching this type
      const matchingAddons = allAddons.filter(a => {
        const aType = (a.type || '').trim().toLowerCase();
        return aType === typeSlug || aType === typeName || aType.includes(typeSlug) || typeSlug.includes(aType);
      });

      const totalAddons = matchingAddons.length;
      const activeAddons = matchingAddons.filter(a => (a.status || '').toLowerCase() === 'active').length;
      const inactiveAddons = totalAddons - activeAddons;

      let connectedProductsCount = 0;
      matchingAddons.forEach(a => {
        connectedProductsCount += (addonUsageMap[String(a._id)] || 0);
      });

      return {
        ...t,
        totalAddons,
        activeAddons,
        inactiveAddons,
        connectedProductsCount
      };
    });

    return sendResponse(res, 200, 'Addon types fetched successfully', enrichedTypes);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch addon types', error.message);
  }
};

export const getAddonTypeById = async (req, res) => {
  try {
    const type = await AddonType.findById(req.params.id);
    if (!type) {
      return sendError(res, 404, 'Addon type not found');
    }
    return sendResponse(res, 200, 'Addon type fetched successfully', type);
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch addon type', error.message);
  }
};

export const createAddonType = async (req, res) => {
  try {
    const { name, description, icon, color, status, sortOrder, isDefault } = req.body;
    if (!name || !name.trim()) {
      return sendError(res, 400, 'Type name is required');
    }

    const slug = (req.body.slug || name).toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const existing = await AddonType.findOne({
      $or: [{ name: new RegExp(`^${name.trim()}$`, 'i') }, { slug }]
    });
    if (existing) {
      return sendError(res, 400, `Type with name '${name}' or slug '${slug}' already exists`);
    }

    const newType = await AddonType.create({
      name: name.trim(),
      slug,
      description: description || '',
      icon: icon || 'Tag',
      color: color || 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30',
      status: status || 'Active',
      sortOrder: Number(sortOrder) || 0,
      isDefault: Boolean(isDefault)
    });

    return sendResponse(res, 201, 'Addon type created successfully', newType);
  } catch (error) {
    return sendError(res, 500, 'Failed to create addon type', error.message);
  }
};

export const updateAddonType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, icon, color, status, sortOrder, isDefault } = req.body;

    const type = await AddonType.findById(id);
    if (!type) {
      return sendError(res, 404, 'Addon type not found');
    }

    if (name && name.trim()) {
      const slug = (req.body.slug || name).toLowerCase().trim().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const conflict = await AddonType.findOne({
        _id: { $ne: id },
        $or: [{ name: new RegExp(`^${name.trim()}$`, 'i') }, { slug }]
      });
      if (conflict) {
        return sendError(res, 400, `Another type with name '${name}' or slug '${slug}' already exists`);
      }
      type.name = name.trim();
      type.slug = slug;
    }

    if (description !== undefined) type.description = description;
    if (icon !== undefined) type.icon = icon;
    if (color !== undefined) type.color = color;
    if (status !== undefined) type.status = status;
    if (sortOrder !== undefined) type.sortOrder = Number(sortOrder) || 0;
    if (isDefault !== undefined) type.isDefault = Boolean(isDefault);

    await type.save();
    return sendResponse(res, 200, 'Addon type updated successfully', type);
  } catch (error) {
    return sendError(res, 500, 'Failed to update addon type', error.message);
  }
};

export const deleteAddonType = async (req, res) => {
  try {
    const { id } = req.params;
    const type = await AddonType.findById(id);
    if (!type) {
      return sendError(res, 404, 'Addon type not found');
    }

    // Check if any addons are currently using this type
    const typeSlug = (type.slug || type.name).toLowerCase();
    const typeName = type.name.toLowerCase();
    const linkedAddonsCount = await Addon.countDocuments({
      $or: [
        { type: new RegExp(`^${typeSlug}$`, 'i') },
        { type: new RegExp(`^${typeName}$`, 'i') }
      ]
    });

    if (linkedAddonsCount > 0) {
      return sendError(
        res,
        400,
        `Cannot delete type '${type.name}'. It is currently used by ${linkedAddonsCount} add-on(s). Reassign or delete those add-ons first.`
      );
    }

    await AddonType.findByIdAndDelete(id);
    return sendResponse(res, 200, 'Addon type deleted successfully');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete addon type', error.message);
  }
};

