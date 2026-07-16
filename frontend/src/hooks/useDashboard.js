import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../services/inventoryService';
import { useInventory } from './useInventory';
import { useState, useMemo } from 'react';
import api from '../services/apiClient';

// Helper hook to fetch users since there isn't a dedicated useUsers hook exported
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/api/users/');
      return response.data;
    }
  });
}

export function useDashboard() {
  const { products, batches, transactions } = useInventory();
  
  const { data: salesInvoices = [], isLoading: isLoadingSales } = useQuery({
    queryKey: ['salesInvoices', 'all'],
    queryFn: () => inventoryService.getSalesInvoices(0, 5000)
  });

  const { data: users = [], isLoading: isLoadingUsers } = useUsers();

  const [selectedProductId, setSelectedProductId] = useState(null);

  // 1. Sales Today
  const salesToday = useMemo(() => {
    const todayStr = new Date().toDateString();
    return salesInvoices
      .filter(invoice => new Date(invoice.created_at).toDateString() === todayStr)
      .reduce((sum, invoice) => sum + Number(invoice.total_amount), 0);
  }, [salesInvoices]);

  // 2. Low Stock Products
  const lowStockProducts = useMemo(() => {
    if (!products.length || !batches.length) return [];
    
    // Group batch balances by product
    const productBalances = {};
    batches.forEach(batch => {
      if (!productBalances[batch.product_id]) {
        productBalances[batch.product_id] = 0;
      }
      productBalances[batch.product_id] += batch.quantity; // quantity here is computed balance from useInventory
    });

    return products
      .filter(p => (productBalances[p.id] || 0) <= p.min_stock_alert)
      .map(p => ({
        ...p,
        current_balance: productBalances[p.id] || 0
      }))
      .sort((a, b) => a.current_balance - b.current_balance);
  }, [products, batches]);

  // 3. Expiring Batches
  const expiringBatches = useMemo(() => {
    if (!batches.length || !products.length) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    return batches
      .filter(b => b.quantity > 0)
      .filter(b => {
        if (!b.expiry_date) return false;
        const expDate = new Date(b.expiry_date);
        return expDate <= thirtyDaysFromNow;
      })
      .map(b => {
        const product = products.find(p => p.id === b.product_id);
        const expDate = new Date(b.expiry_date);
        return {
          ...b,
          product_name: product?.name || 'Unknown Product',
          product_sku: product?.sku || 'Unknown SKU',
          is_expired: expDate < today,
          days_left: Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
        };
      })
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
  }, [batches, products]);

  // 4. Active Cashiers (Mocking active by fetching enabled cashiers)
  const activeCashiers = useMemo(() => {
    return users.filter(u => u.role === 'cashier' && u.is_active);
  }, [users]);

  // Default selected product for graph
  const defaultSelectedProductId = useMemo(() => {
    if (selectedProductId) return selectedProductId;
    return 'all';
  }, [selectedProductId]);

  const actualSelectedProductId = selectedProductId || defaultSelectedProductId;

  // 4. Product Sales Graph Data (Last 30 Days)
  const salesGraphData = useMemo(() => {
    if (!batches.length || !salesInvoices.length) return [];
    
    // Get all batch IDs for the selected product (null means all products)
    const productBatchIds = actualSelectedProductId === 'all'
      ? null
      : new Set(batches.filter(b => b.product_id === actualSelectedProductId).map(b => b.id));

    const days = 30;
    const dataMap = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Initialize last 30 days
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dataMap[dateStr] = { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), quantity: 0, revenue: 0 };
    }

    // Aggregate sales
    salesInvoices.forEach(invoice => {
      const invoiceDate = new Date(invoice.created_at);
      invoiceDate.setHours(0, 0, 0, 0);
      const dateStr = invoiceDate.toISOString().split('T')[0];
      
      if (dataMap[dateStr]) {
        invoice.items?.forEach(item => {
          if (productBatchIds === null || productBatchIds.has(item.batch_id)) {
            dataMap[dateStr].quantity += item.quantity;
            dataMap[dateStr].revenue += Number(item.subtotal);
          }
        });
      }
    });

    return Object.values(dataMap);
  }, [actualSelectedProductId, batches, salesInvoices]);

  return {
    salesToday,
    lowStockProducts,
    expiringBatches,
    activeCashiers,
    salesGraphData,
    products, // For the dropdown
    selectedProductId: actualSelectedProductId,
    setSelectedProductId,
    isLoading: isLoadingSales || isLoadingUsers || products.length === 0
  };
}
