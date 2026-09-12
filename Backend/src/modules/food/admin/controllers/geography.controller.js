import mongoose from 'mongoose';
import { FoodRegion } from '../models/region.model.js';
import { FoodZone } from '../models/zone.model.js';
import { FoodTerritory } from '../models/territory.model.js';
import { FoodFranchise } from '../../franchise/models/franchise.model.js';
import { FoodStore } from '../../store/models/store.model.js';
import { sendError, sendResponse } from '../../../../utils/response.js';

// ===================== REGIONS =====================
export const getRegions = async (req, res) => {
    try {
        const enrichedRegions = await FoodRegion.aggregate([
            {
                $addFields: {
                    regionIdStr: { $toString: "$_id" }
                }
            },
            {
                $lookup: {
                    from: "food_zones",
                    let: { r_id: "$regionIdStr" },
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: "$regionId" }, "$$r_id"] } } }
                    ],
                    as: "zones"
                }
            },
            {
                $lookup: {
                    from: "food_franchises",
                    let: { r_id: "$regionIdStr" },
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: "$regionId" }, "$$r_id"] } } }
                    ],
                    as: "franchises"
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    country: 1,
                    description: 1,
                    isActive: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    zonesCount: { $size: "$zones" },
                    franchisesCount: { $size: "$franchises" },
                    storesCount: { $sum: "$franchises.totalStores" }
                }
            }
        ]);

        const mappedRegions = enrichedRegions.map(region => ({
            ...region,
            id: region._id,
            status: region.isActive ? 'Active' : 'Inactive',
            createdDate: new Date(region.createdAt).toISOString().slice(0, 10)
        }));

        return sendResponse(res, 200, 'Regions fetched successfully', mappedRegions);
    } catch (error) {
        console.error('Error fetching regions:', error);
        return sendError(res, 500, 'Failed to fetch regions', error.message);
    }
};

export const createRegion = async (req, res) => {
    try {
        const { name, country, description, status } = req.body;
        if (!name) return sendError(res, 400, 'Name is required');

        const region = await FoodRegion.create({
            name,
            country: country || 'India',
            description,
            isActive: status !== 'Inactive'
        });

        return sendResponse(res, 201, 'Region created successfully', region);
    } catch (error) {
        console.error('Error creating region:', error);
        return sendError(res, 500, 'Failed to create region', error.message);
    }
};

// ===================== REGIONS (CRUD) =====================
export const getRegionById = async (req, res) => {
    try {
        const region = await FoodRegion.findById(req.params.id).lean();
        if (!region) return sendError(res, 404, 'Region not found');
        
        const zonesCount = await FoodZone.countDocuments({ regionId: region._id });
        const franchisesCount = await FoodFranchise.countDocuments({ regionId: region._id.toString() });
        const franchises = await FoodFranchise.find({ regionId: region._id.toString() }, 'totalStores');
        const storesCount = franchises.reduce((acc, f) => acc + (f.totalStores || 0), 0);

        const enrichedRegion = {
            ...region,
            id: region._id,
            zonesCount,
            franchisesCount,
            storesCount,
            status: region.isActive ? 'Active' : 'Inactive',
            createdDate: new Date(region.createdAt).toISOString().slice(0,10)
        };
        return sendResponse(res, 200, 'Region fetched successfully', enrichedRegion);
    } catch (error) {
        console.error('Error fetching region:', error);
        return sendError(res, 500, 'Failed to fetch region', error.message);
    }
};

export const updateRegion = async (req, res) => {
    try {
        const { name, country, description, status } = req.body;
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (country !== undefined) updateData.country = country;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.isActive = status !== 'Inactive';

        const region = await FoodRegion.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!region) return sendError(res, 404, 'Region not found');
        return sendResponse(res, 200, 'Region updated successfully', region);
    } catch (error) {
        console.error('Error updating region:', error);
        return sendError(res, 500, 'Failed to update region', error.message);
    }
};

export const deleteRegion = async (req, res) => {
    try {
        const region = await FoodRegion.findByIdAndDelete(req.params.id);
        if (!region) return sendError(res, 404, 'Region not found');
        // Note: Dependent zones/franchises might need cleanup or cascading logic later
        return sendResponse(res, 200, 'Region deleted successfully');
    } catch (error) {
        console.error('Error deleting region:', error);
        return sendError(res, 500, 'Failed to delete region', error.message);
    }
};

// ===================== ZONES =====================
export const getZones = async (req, res) => {
    try {
        const enrichedZones = await FoodZone.aggregate([
            {
                $addFields: {
                    zoneIdStr: { $toString: "$_id" }
                }
            },
            {
                $lookup: {
                    from: "food_regions",
                    let: { r_id: { $toString: "$regionId" } },
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$r_id"] } } }
                    ],
                    as: "regionDocs"
                }
            },
            {
                $lookup: {
                    from: "food_territories",
                    let: { z_id: "$zoneIdStr" },
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: "$zoneId" }, "$$z_id"] } } }
                    ],
                    as: "territories"
                }
            },
            {
                $lookup: {
                    from: "food_franchises",
                    let: { z_id: "$zoneIdStr" },
                    pipeline: [
                        { $match: { $expr: { $eq: [{ $toString: "$zoneId" }, "$$z_id"] } } }
                    ],
                    as: "franchises"
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    description: 1,
                    zoneName: 1,
                    country: 1,
                    serviceLocation: 1,
                    unit: 1,
                    coordinates: 1,
                    isActive: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    regionId: 1,
                    regionDoc: { $arrayElemAt: ["$regionDocs", 0] },
                    territoriesCount: { $size: "$territories" },
                    franchisesCount: { $size: "$franchises" },
                    storesCount: { $sum: "$franchises.totalStores" }
                }
            }
        ]);

        const mappedZones = enrichedZones.map(zone => {
            const result = {
                ...zone,
                id: zone._id,
                regionName: zone.regionDoc ? zone.regionDoc.name : 'Unknown',
                regionId: zone.regionDoc ? zone.regionDoc._id : zone.regionId,
                status: zone.isActive ? 'Active' : 'Inactive',
                createdDate: new Date(zone.createdAt).toISOString().slice(0, 10)
            };
            delete result.regionDoc;
            delete result.regionDocs;
            return result;
        });

        return sendResponse(res, 200, 'Zones fetched successfully', mappedZones);
    } catch (error) {
        console.error('Error fetching zones:', error);
        return sendError(res, 500, 'Failed to fetch zones', error.message);
    }
};

export const createZone = async (req, res) => {
    try {
        const { name, regionId, description, status, coordinates } = req.body;
        if (!name || !regionId) return sendError(res, 400, 'Name and Region are required');

        const zone = await FoodZone.create({
            name,
            regionId,
            description,
            isActive: status !== 'Inactive',
            coordinates: coordinates && coordinates.length >= 3 ? coordinates : [{latitude: 0, longitude: 0}, {latitude: 1, longitude: 1}, {latitude: 2, longitude: 2}]
        });

        return sendResponse(res, 201, 'Zone created successfully', zone);
    } catch (error) {
        console.error('Error creating zone:', error);
        return sendError(res, 500, 'Failed to create zone', error.message);
    }
};

// ===================== ZONES (CRUD) =====================
export const getZoneById = async (req, res) => {
    try {
        const zone = await FoodZone.findById(req.params.id).populate('regionId', 'name').lean();
        if (!zone) return sendError(res, 404, 'Zone not found');
        
        const territoriesCount = await FoodTerritory.countDocuments({ zoneId: zone._id });
        const franchisesCount = await FoodFranchise.countDocuments({ zoneId: zone._id.toString() });
        const franchises = await FoodFranchise.find({ zoneId: zone._id.toString() }, 'totalStores');
        const storesCount = franchises.reduce((acc, f) => acc + (f.totalStores || 0), 0);

        const enrichedZone = {
            ...zone,
            id: zone._id,
            regionName: zone.regionId ? zone.regionId.name : 'Unknown',
            regionId: zone.regionId ? zone.regionId._id : null,
            territoriesCount,
            franchisesCount,
            storesCount,
            status: zone.isActive ? 'Active' : 'Inactive',
            createdDate: new Date(zone.createdAt).toISOString().slice(0,10)
        };
        return sendResponse(res, 200, 'Zone fetched successfully', enrichedZone);
    } catch (error) {
        console.error('Error fetching zone:', error);
        return sendError(res, 500, 'Failed to fetch zone', error.message);
    }
};

export const updateZone = async (req, res) => {
    try {
        const { name, regionId, description, status, coordinates } = req.body;
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (regionId !== undefined) updateData.regionId = regionId;
        if (description !== undefined) updateData.description = description;
        if (status !== undefined) updateData.isActive = status !== 'Inactive';
        if (coordinates !== undefined) updateData.coordinates = coordinates;

        const zone = await FoodZone.findByIdAndUpdate(req.params.id, updateData, { new: true }).populate('regionId', 'name');
        if (!zone) return sendError(res, 404, 'Zone not found');
        return sendResponse(res, 200, 'Zone updated successfully', zone);
    } catch (error) {
        console.error('Error updating zone:', error);
        return sendError(res, 500, 'Failed to update zone', error.message);
    }
};

export const deleteZone = async (req, res) => {
    try {
        const zone = await FoodZone.findByIdAndDelete(req.params.id);
        if (!zone) return sendError(res, 404, 'Zone not found');
        return sendResponse(res, 200, 'Zone deleted successfully');
    } catch (error) {
        console.error('Error deleting zone:', error);
        return sendError(res, 500, 'Failed to delete zone', error.message);
    }
};

// ===================== TERRITORIES =====================
export const getTerritories = async (req, res) => {
    try {
        const territories = await FoodTerritory.aggregate([
            {
                $addFields: { idString: { $toString: "$_id" } }
            },
            {
                $lookup: {
                    from: "food_franchises",
                    localField: "idString",
                    foreignField: "territoryId",
                    as: "franchisesData",
                    pipeline: [
                        { $project: { _id: 1, name: 1, ownerName: 1, franchiseCode: 1, totalStores: 1 } }
                    ]
                }
            },
            {
                $addFields: {
                    franchisesCount: { $size: "$franchisesData" },
                    storesCount: { $sum: "$franchisesData.totalStores" }
                }
            }
        ]);

        const enrichedTerritories = territories.map(territory => ({
            id: territory._id,
            name: territory.name,
            zoneId: territory.zoneId,
            description: territory.description,
            isActive: territory.isActive,
            postalCodes: territory.postalCodes,
            coordinates: territory.coordinates,
            franchisesCount: territory.franchisesCount,
            storesCount: territory.storesCount,
            franchisesData: territory.franchisesData,
            status: territory.isActive ? 'Active' : 'Archived',
            createdDate: new Date(territory.createdAt).toISOString().slice(0,10),
            createdAt: new Date(territory.createdAt).toISOString().slice(0,10)
        }));

        return sendResponse(res, 200, 'Territories fetched successfully', enrichedTerritories);
    } catch (error) {
        console.error('Error fetching territories:', error);
        return sendError(res, 500, 'Failed to fetch territories', error.message);
    }
};

export const createTerritory = async (req, res) => {
    try {
        const { name, zoneId, description, status, postalCodes, coordinates } = req.body;
        if (!name || !zoneId) return sendError(res, 400, 'Name and Zone are required');

        const territory = await FoodTerritory.create({
            name,
            zoneId,
            description,
            postalCodes: postalCodes || [],
            coordinates: coordinates || [],
            isActive: status !== 'Archived'
        });

        return sendResponse(res, 201, 'Territory created successfully', territory);
    } catch (error) {
        console.error('Error creating territory:', error);
        return sendError(res, 500, 'Failed to create territory', error.message);
    }
};

// ===================== TERRITORIES (CRUD) =====================
export const getTerritoryById = async (req, res) => {
    try {
        const territories = await FoodTerritory.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
            {
                $addFields: { idString: { $toString: "$_id" } }
            },
            {
                $lookup: {
                    from: "food_franchises",
                    localField: "idString",
                    foreignField: "territoryId",
                    as: "franchisesData",
                    pipeline: [
                        { $project: { _id: 1, name: 1, ownerName: 1, franchiseCode: 1, totalStores: 1 } }
                    ]
                }
            },
            {
                $addFields: {
                    franchisesCount: { $size: "$franchisesData" },
                    storesCount: { $sum: "$franchisesData.totalStores" }
                }
            }
        ]);

        if (!territories || territories.length === 0) {
            return sendError(res, 404, 'Territory not found');
        }

        const territory = territories[0];
        const enrichedTerritory = {
            id: territory._id,
            name: territory.name,
            zoneId: territory.zoneId,
            description: territory.description,
            isActive: territory.isActive,
            postalCodes: territory.postalCodes,
            coordinates: territory.coordinates,
            franchisesCount: territory.franchisesCount,
            storesCount: territory.storesCount,
            franchisesData: territory.franchisesData,
            status: territory.isActive ? 'Active' : 'Archived',
            createdDate: new Date(territory.createdAt).toISOString().slice(0,10),
            createdAt: new Date(territory.createdAt).toISOString().slice(0,10)
        };
        return sendResponse(res, 200, 'Territory fetched successfully', enrichedTerritory);
    } catch (error) {
        console.error('Error fetching territory:', error);
        return sendError(res, 500, 'Failed to fetch territory', error.message);
    }
};

export const updateTerritory = async (req, res) => {
    try {
        const { name, zoneId, description, status, postalCodes, coordinates } = req.body;
        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (zoneId !== undefined) updateData.zoneId = zoneId;
        if (description !== undefined) updateData.description = description;
        if (postalCodes !== undefined) updateData.postalCodes = postalCodes;
        if (coordinates !== undefined) updateData.coordinates = coordinates;
        if (status !== undefined) updateData.isActive = status !== 'Archived' && status !== 'Inactive' && status !== false;

        const territory = await FoodTerritory.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!territory) return sendError(res, 404, 'Territory not found');
        
        const formattedTerritory = {
            id: territory._id,
            name: territory.name,
            zoneId: territory.zoneId,
            description: territory.description,
            isActive: territory.isActive,
            postalCodes: territory.postalCodes,
            coordinates: territory.coordinates,
            status: territory.isActive ? 'Active' : 'Archived',
            createdDate: new Date(territory.createdAt).toISOString().slice(0,10),
            createdAt: new Date(territory.createdAt).toISOString().slice(0,10)
        };
        
        return sendResponse(res, 200, 'Territory updated successfully', formattedTerritory);
    } catch (error) {
        console.error('Error updating territory:', error);
        return sendError(res, 500, 'Failed to update territory', error.message);
    }
};

export const deleteTerritory = async (req, res) => {
    try {
        const territory = await FoodTerritory.findByIdAndDelete(req.params.id);
        if (!territory) return sendError(res, 404, 'Territory not found');
        return sendResponse(res, 200, 'Territory deleted successfully');
    } catch (error) {
        console.error('Error deleting territory:', error);
        return sendError(res, 500, 'Failed to delete territory', error.message);
    }
};
