import api from './apiClient';

export const inventoryService = {
  getProducts: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/products/', { params: { skip, limit } });
    return response.data;
  },

  createProduct: async (data) => {
    const response = await api.post('/api/products/', data);
    return response.data;
  },

  updateProduct: async (productId, data) => {
    const response = await api.put(`/api/products/${productId}`, data);
    return response.data;
  },

  deleteProduct: async (productId) => {
    const response = await api.delete(`/api/products/${productId}`);
    return response.data;
  },

  getBatches: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/batches/', { params: { skip, limit } });
    return response.data;
  },

  getBatchBalance: async (batchId, warehouseId) => {
    const response = await api.get(`/api/stock-transactions/balance/batch/${batchId}/warehouse/${warehouseId}`);
    return response.data;
  },

  getProductBalance: async (productId, warehouseId) => {
    const response = await api.get(`/api/stock-transactions/balance/product/${productId}/warehouse/${warehouseId}`);
    return response.data;
  },

  getWarehouses: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/warehouses/', { params: { skip, limit } });
    return response.data;
  },

  getSuppliers: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/suppliers/', { params: { skip, limit } });
    return response.data;
  },

  getStockTransactions: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/stock-transactions/', { params: { skip, limit } });
    return response.data;
  },

  getStockTransactionsEnriched: async (skip = 0, limit = 500) => {
    const response = await api.get('/api/stock-transactions/enriched', { params: { skip, limit } });
    return response.data;
  },

  getPurchaseInvoices: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/purchase-invoices/', { params: { skip, limit } });
    return response.data;
  },

  updatePurchaseInvoiceStatus: async (invoiceId, status) => {
    const response = await api.patch(`/api/purchase-invoices/${invoiceId}/status`, { new_status: status });
    return response.data;
  },

  getSalesInvoices: async (skip = 0, limit = 100) => {
    const response = await api.get('/api/sales/', { params: { skip, limit } });
    return response.data;
  }
};
