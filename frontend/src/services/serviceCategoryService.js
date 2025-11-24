import api from '../utils/api';

// Service category API calls
const getServiceCategories = () => {
  return api.get('/api/service-categories');
};

const createServiceCategory = (categoryData) => {
  return api.post('/api/service-categories', categoryData);
};

const updateServiceCategory = (id, categoryData) => {
  return api.put(`/api/service-categories/${id}`, categoryData);
};

const deleteServiceCategory = (id) => {
  return api.delete(`/api/service-categories/${id}`);
};

export default {
  getServiceCategories,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory
};
