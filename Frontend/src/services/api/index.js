import apiClient, { API_ENDPOINTS } from "./core.js";

export { searchAPI, api } from "./core.js";
export { authAPI } from "./authApiModule.js";
export { supportAPI, notificationAPI } from "./supportApiModule.js";
export { adminAPI } from "./adminApiModule.js";
export { restaurantAPI, diningAPI } from "./restaurantApiModule.js";
export { userAPI, publicGetOnce, heroBannerAPI, publicAPI } from "./userApiModule.js";
export { deliveryAPI } from "./deliveryApiModule.js";
export { locationAPI, zoneAPI, storeAPI } from "./locationApiModule.js";
export { orderAPI, uploadAPI } from "./orderApiModule.js";

export { profileApi } from "./profileApi.js";
export { myTasksService } from "./myTasksService.js";

export default apiClient;
export { API_ENDPOINTS };
