import { FoodAdmin } from "./admin.model.js";
import { logger } from "../../utils/logger.js";

export const cleanupLegacySuperAdmin = async () => {
    try {
        const result = await FoodAdmin.deleteMany({ role: "superadmin" });
        if (result.deletedCount > 0) {
            logger.info(`Deleted ${result.deletedCount} legacy superadmin(s) from food_admins collection.`);
        }
    } catch (err) {
        logger.error("Error cleaning up legacy superadmin: " + err.message);
    }
};
