import { sendResponse } from '../../../../utils/response.js';
import * as profile from '../services/storeProfile.service.js';
import { validatePersonalProfile, validateChangePassword, validateNotifications } from '../validators/attendance.validator.js';

// /v1/profile/* : the caller's own profile. The account always comes from the token (req.user), never from the request.
// Session calls may carry the caller's own refresh token in the X-Refresh-Token header, to tell "this device" from the others.

// A client mistake (400 / 403 / 404 / 409) is answered { success, message, error }: the screens show `message`, and the
// shared error handler's `error` stays for the callers that read it. Anything else goes to the central error handler.
const wrap = (message, status, fn) => async (req, res, next) => {
    try {
        return sendResponse(res, status, message, await fn(req));
    } catch (err) {
        if (err?.statusCode >= 400 && err.statusCode < 500) return res.status(err.statusCode).json({ success: false, message: err.message, error: err.message });
        return next(err);
    }
};
const refreshTokenOf = (req) => req.get('x-refresh-token') || undefined;

export const getProfile = wrap('Profile fetched', 200, (req) => profile.getProfile(req.user, refreshTokenOf(req)));
export const updatePersonal = wrap('Profile updated successfully', 200, (req) => profile.updatePersonal(req.user, validatePersonalProfile(req.body)));
export const changePassword = wrap('Password changed successfully', 200, (req) => profile.changePassword(req.user, validateChangePassword(req.body)));
export const uploadPhoto = wrap('Profile photo updated', 200, (req) => profile.uploadPhoto(req.user, req.file));
export const getPermissions = wrap('Permissions fetched', 200, (req) => profile.permissions(req.user));
export const getPerformance = wrap('Performance fetched', 200, (req) => profile.performance(req.user));
export const getAttendance = wrap('Attendance fetched', 200, (req) => profile.attendance(req.user));
export const updateNotifications = wrap('Notification settings updated', 200, (req) => profile.updateNotifications(req.user, validateNotifications(req.body)));
export const getActivityLogs = wrap('Activity fetched', 200, (req) => profile.activityLogs(req.user));
export const deleteSession = wrap('Session terminated successfully.', 200, (req) => profile.deleteSession(req.user, req.params.id));
export const deleteSessions = wrap('Sessions terminated successfully.', 200, (req) => profile.deleteSessions(req.user, String(req.query.scope || ''), refreshTokenOf(req)));
