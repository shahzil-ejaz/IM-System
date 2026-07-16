import apiClient from './apiClient';

export const metadataService = {
  // Brands
  getBrands: async () => {
    const response = await apiClient.get('/api/brands/');
    return response.data;
  },
  createBrand: async (data) => {
    const response = await apiClient.post('/api/brands/', data);
    return response.data;
  },
  deleteBrand: async (id) => {
    const response = await apiClient.delete(`/api/brands/${id}`);
    return response.data;
  },

  // Categories
  getCategories: async () => {
    const response = await apiClient.get('/api/categories/');
    return response.data;
  },
  createCategory: async (data) => {
    const response = await apiClient.post('/api/categories/', data);
    return response.data;
  },
  deleteCategory: async (id) => {
    const response = await apiClient.delete(`/api/categories/${id}`);
    return response.data;
  },

  // Units
  getUnits: async () => {
    const response = await apiClient.get('/api/units/');
    return response.data;
  },
  createUnit: async (data) => {
    const response = await apiClient.post('/api/units/', data);
    return response.data;
  },
  deleteUnit: async (id) => {
    const response = await apiClient.delete(`/api/units/${id}`);
    return response.data;
  },

  // Suppliers
  getSuppliers: async () => {
    const response = await apiClient.get('/api/suppliers/');
    return response.data;
  },
  createSupplier: async (data) => {
    const response = await apiClient.post('/api/suppliers/', data);
    return response.data;
  },
  updateSupplier: async (id, data) => {
    const response = await apiClient.put(`/api/suppliers/${id}`, data);
    return response.data;
  },
  deleteSupplier: async (id) => {
    const response = await apiClient.delete(`/api/suppliers/${id}`);
    return response.data;
  },

  // Warehouses
  getWarehouses: async () => {
    const response = await apiClient.get('/api/warehouses/');
    return response.data;
  },
  createWarehouse: async (data) => {
    const response = await apiClient.post('/api/warehouses/', data);
    return response.data;
  },
  deleteWarehouse: async (id) => {
    const response = await apiClient.delete(`/api/warehouses/${id}`);
    return response.data;
  }
};
