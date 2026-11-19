import * as desk from '../services/complaintDesk.service.js';
import { scopedStoreIds } from '../../shared/franchiseScope.js';

// Customer Complaints desk (franchise admin / super admin). The franchise scope comes from the token, never from the request.
const handle = (message, run, status = 200) => async (req, res, next) => {
    try {
        const data = await run(req, { storeIds: await scopedStoreIds(req), user: req.user });
        res.status(status).json({ success: true, message, data });
    } catch (error) {
        next(error);
    }
};

export const listComplaintDesk = handle('Complaints fetched', (req, ctx) => desk.listComplaintDesk(req.query || {}, ctx));
export const getComplaintDesk = handle('Complaint fetched', (req, ctx) => desk.complaintDeskDetails(req.params.id, ctx));
export const resolveComplaintDesk = handle('Complaint resolved', (req, ctx) => desk.resolveComplaint(req.params.id, req.body, ctx));
export const closeComplaintDesk = handle('Complaint closed', (req, ctx) => desk.closeComplaint(req.params.id, req.body, ctx));
export const addComplaintDeskNote = handle('Note added', (req, ctx) => desk.addComplaintNote(req.params.id, req.body, ctx), 201);
export const deleteComplaintDeskNote = handle('Note removed', (req, ctx) => desk.deleteComplaintNote(req.params.id, req.params.noteId, ctx));
