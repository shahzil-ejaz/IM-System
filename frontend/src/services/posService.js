import api from './apiClient';

export const posService = {
  checkout: async (payload) => {
    /* 
      Expected Payload:
      {
        "cashier_id": 1,
        "payment_method": "cash|card|split|unpaid",
        "discount_amount": 5.00,
        "items": [{"batch_id": 1, "quantity": 2}]
      }
    */
    const response = await api.post('/api/sales/checkout', payload);
    return response.data;
  }
};
