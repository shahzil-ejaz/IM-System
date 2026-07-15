import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  
  const generateInvoiceNumber = () => `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
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
      setInvoiceNumber(generateInvoiceNumber());
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
          <h1 className="text-lg font-bold text-text-primary tracking-tight">Receive Stock (Procurement)</h1>
          <p className="text-text-secondary text-xs mt-0.5">Process incoming delivery batches from suppliers.</p>
        </div>
      </div>

      <div className="border border-border bg-white rounded-lg overflow-hidden shadow-sm">
        {/* Summary & Actions Header */}
        <div className="p-4 bg-slate-50 border-b border-border flex justify-between items-center">
          <div className="flex gap-6">
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-400">Total Items</span>
              <span className="font-mono text-sm font-semibold">{items.length}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-400">Total Value</span>
              <span className="font-mono text-sm font-semibold">Rs {calculateTotal().toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <AnimatePresence>
              {errorMessage && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-red-500 text-xs font-medium">
                  {errorMessage}
                </motion.span>
              )}
              {isSuccess && (
                <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Invoice Received
                </motion.span>
              )}
            </AnimatePresence>
            <Button 
              onClick={handleSubmit} 
              disabled={items.length === 0 || !supplierId || !invoiceNumber || receiveStockMutation.isPending}
              className="bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.97] transition-transform duration-150 ease-out h-8 text-xs px-4"
            >
              {receiveStockMutation.isPending ? 'Committing...' : 'Commit to Ledger'}
            </Button>
          </div>
        </div>

        {/* Invoice Metadata Fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-border border-b border-border bg-white">
          <div className="p-4 space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Supplier</label>
            <Select value={supplierId || undefined} onValueChange={setSupplierId}>
              <SelectTrigger className="w-full h-8 px-2 text-xs border border-border rounded-md bg-canvas focus:ring-2 focus:ring-slate-900 outline-none transition-all text-slate-900 font-medium data-[placeholder]:text-slate-900">
                <SelectValue placeholder="Select Supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="p-4 space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Invoice Number</label>
            <Input 
              placeholder="e.g. INV-2023-001" 
              value={invoiceNumber}
              onChange={e => setInvoiceNumber(e.target.value)}
              className="h-8 text-xs px-2"
            />
          </div>
          <div className="p-4 space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Warehouse</label>
            <Select value={warehouseId} disabled>
              <SelectTrigger className="w-full h-8 px-2 text-xs border border-border rounded-md bg-canvas outline-none text-slate-900 font-medium disabled:opacity-100">
                <SelectValue placeholder="Select Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Primary Warehouse</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Items Section Header */}
        <div className="py-3 px-4 bg-slate-50 border-b border-border/50 flex flex-row items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wider text-text-primary">Incoming Items</span>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="h-8 text-xs active:scale-[0.97] transition-transform duration-150 ease-out"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={addItemRow} className="h-8 text-xs">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Row
            </Button>
          </div>
        </div>

        {/* Items Section Table */}
        <div className="bg-white">
          {items.length === 0 ? (
            <div className="p-8 text-center text-text-secondary text-xs">
              No items added yet. Click "Add Row" to begin.
            </div>
          ) : (
            <div className="divide-y divide-border/50 overflow-x-auto no-scrollbar">
              <div className="min-w-[600px]">
                <div className="grid grid-cols-12 gap-2 p-2 bg-slate-50/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="col-span-5 px-2">Product</div>
                  <div className="col-span-2">Quantity</div>
                  <div className="col-span-2">Cost</div>
                  <div className="col-span-2">Retail</div>
                  <div className="col-span-1"></div>
                </div>
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-12 gap-2 p-2 items-center border-b border-border/50 last:border-0"
                    >
                      <div className="col-span-5">
                        <select 
                          className="w-full h-8 px-2 text-xs border border-border rounded-md bg-canvas focus:ring-2 focus:ring-slate-900 outline-none transition-all"
                          value={item.product_id}
                          onChange={(e) => updateItem(item.id, 'product_id', e.target.value)}
                        >
                          <option value="">Select product...</option>
                          {products?.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <Input type="number" className="h-8 text-xs" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" className="h-8 text-xs" value={item.unit_cost_price} onChange={(e) => updateItem(item.id, 'unit_cost_price', e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" className="h-8 text-xs" value={item.retail_price} onChange={(e) => updateItem(item.id, 'retail_price', e.target.value)} />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => removeItem(item.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
