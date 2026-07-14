import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useInventory } from '../../../hooks/useInventory';
import { useAuth } from '../../../hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../services/apiClient';
import { motion, AnimatePresence } from 'motion/react';

export function ProcurementView() {
  const { products, suppliers = [], isLoadingProducts } = useInventory();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [warehouseId, setWarehouseId] = useState('1'); // Default warehouse
  const [items, setItems] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const receiveStockMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiClient.post('/api/purchase-invoices/receive-stock', payload);
      return response.data;
    },
    onSuccess: () => {
      setIsSuccess(true);
      setErrorMessage('');
      setSupplierId('');
      setInvoiceNumber('');
      setItems([]);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setTimeout(() => setIsSuccess(false), 3000);
    },
    onError: (error) => {
      console.error('Invoice Commit Error:', error);
      setErrorMessage(error.response?.data?.detail || 'Failed to commit invoice. Please check your data.');
    }
  });

  const addItemRow = () => {
    // Generate a default batch string and expiry date (1 year from now)
    const defaultBatch = `B-${Date.now().toString().slice(-6)}`;
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    
    setItems([...items, { 
      id: Date.now(), 
      product_id: '', 
      batch_number: defaultBatch,
      expiry_date: nextYear.toISOString().split('T')[0],
      quantity: 1, 
      unit_cost_price: 0, 
      retail_price: 0 
    }]);
  };

  const updateItem = (id, field, value) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_cost_price)), 0);
  };

  const handleSubmit = () => {
    if (!supplierId || !invoiceNumber || items.length === 0) return;
    
    const payload = {
      supplier_id: Number(supplierId),
      invoice_number: invoiceNumber,
      total_amount: calculateTotal(),
      received_by_user_id: user?.id || 1, // Fallback if no user
      items: items.map(i => ({
        product_id: Number(i.product_id),
        warehouse_id: Number(warehouseId),
        batch_number: i.batch_number,
        cost_price: Number(i.unit_cost_price),
        retail_price: Number(i.retail_price),
        expiry_date: i.expiry_date,
        quantity_received: Number(i.quantity)
      }))
    };
    
    receiveStockMutation.mutate(payload);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Receive Stock (Procurement)</h1>
          <p className="text-text-secondary text-sm mt-1">Process incoming delivery batches from suppliers.</p>
        </div>
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {isSuccess && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium text-green-600 flex items-center bg-green-50 px-3 py-1.5 rounded-full"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Stock Received
              </motion.div>
            )}
            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium text-red-600 flex items-center bg-red-50 px-3 py-1.5 rounded-full"
              >
                {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>
          <Button 
            onClick={handleSubmit} 
            disabled={receiveStockMutation.isPending || items.length === 0 || !supplierId}
            className="transition-all"
          >
            <Plus className="w-4 h-4 mr-2" />
            {receiveStockMutation.isPending ? 'Committing...' : 'Commit Invoice'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <Card className="col-span-3 shadow-sm bg-surface/90 backdrop-blur-md border-border/60">
          <CardHeader className="py-5 border-b border-border/50">
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Invoice Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase">Supplier</label>
              <select 
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={supplierId}
                onChange={e => setSupplierId(e.target.value)}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase">Invoice Number</label>
              <Input 
                placeholder="INV-2023-XYZ" 
                value={invoiceNumber}
                onChange={e => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-text-secondary uppercase">Calculated Total ($)</label>
              <div className="h-10 flex items-center px-3 border border-border/50 bg-slate-50/50 rounded-md font-mono font-medium text-lg">
                ${calculateTotal().toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-sm bg-surface/90 backdrop-blur-md border-border/60">
          <CardHeader className="py-4 border-b border-border/50 flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-text-secondary">Incoming Items</CardTitle>
              <CardDescription>Map incoming stock to existing products</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addItemRow}>
              <Plus className="w-4 h-4 mr-2" /> Add Item Row
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {items.length === 0 ? (
              <div className="p-12 text-center text-text-secondary">
                <p className="text-sm">No items added to this invoice yet.</p>
                <Button variant="link" onClick={addItemRow} className="mt-2">Start adding items</Button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                <div className="grid grid-cols-12 gap-4 p-4 bg-slate-50/50 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  <div className="col-span-4">Product</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Unit Cost ($)</div>
                  <div className="col-span-2">Retail Price ($)</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="grid grid-cols-12 gap-4 p-4 items-center overflow-hidden"
                    >
                      <div className="col-span-4">
                        <select 
                          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                          value={item.product_id}
                          onChange={(e) => updateItem(item.id, 'product_id', e.target.value)}
                        >
                          <option value="">Select a product...</option>
                          {products?.map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          min="1" 
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={item.unit_cost_price}
                          onChange={(e) => updateItem(item.id, 'unit_cost_price', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input 
                          type="number" 
                          step="0.01" 
                          value={item.retail_price}
                          onChange={(e) => updateItem(item.id, 'retail_price', e.target.value)}
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
