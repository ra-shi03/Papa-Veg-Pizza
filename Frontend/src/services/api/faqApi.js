import { adminClient, userClient } from "./axios.js";

export const faqAPI = {
  // Public for User Help Center
  getPublicFaqs: () => userClient.get('/settings/faqs/public'),

  // SuperAdmin FAQ Management
  getAdminFaqs: () => adminClient.get('/settings/faqs/admin'),
  createFaq: (data) => adminClient.post('/settings/faqs', data),
  updateFaq: (id, data) => adminClient.put(`/settings/faqs/${id}`, data),
  deleteFaq: (id) => adminClient.delete(`/settings/faqs/${id}`),
  toggleFaq: (id) => adminClient.patch(`/settings/faqs/${id}/toggle`),
};

export default faqAPI;

