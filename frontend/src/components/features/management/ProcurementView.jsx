import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, CheckCircle2, MessageCircle, X } from 'lucide-react';
import { useInventory } from '../../../hooks/useInventory';
import { useAuth } from '../../../hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../../services/apiClient';
import { motion, AnimatePresence } from 'motion/react';
import { usePopup } from '../../../contexts/PopupContext';

export function ProcurementView() {
  const { products, suppliers = [], isLoadingProducts } = useInventory();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showPopup } = usePopup();

  const generateInvoiceNumber = () => `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;

  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber());
  const [warehouseId, setWarehouseId] = useState('1'); // Default warehouse
  const [items, setItems] = useState([]);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);

  const receiveStockMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiClient.post('/api/purchase-invoices/receive-stock', payload);
      return response.data;
    },
    onSuccess: () => {
      setSupplierId('');
      setInvoiceNumber(generateInvoiceNumber());
      setItems([]);
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      showPopup({ title: 'Success', message: 'Invoice Received and Stock Updated', type: 'success' });
    },
    onError: (error) => {
      console.error('Invoice Commit Error:', error);
      showPopup({ title: 'Error', message: error.response?.data?.detail || 'Failed to commit invoice. Please check your data.', type: 'error' });
    }
  });

  const addItemRow = () => {
    // Generate a default batch string
    const defaultBatch = `B-${Date.now().toString().slice(-6)}`;

    setItems([...items, {
      id: Date.now(),
      product_id: '',
      batch_number: defaultBatch,
      expiry_date: '',
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
    <div className="space-y-6 w-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">Receive Stock (Procurement)</h1>
          <p className="text-text-secondary text-xs mt-0.5">Process incoming delivery batches from suppliers.</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setIsContactDialogOpen(true)}
          className="h-8 text-xs bg-white border-border/50 shadow-sm hover:bg-slate-50 hover:text-emerald-600 active:scale-[0.97] transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5 mr-2" />
          Contact Supplier
        </Button>
      </div>

      <div className="border border-border bg-white rounded-lg overflow-hidden shadow-sm">
        {/* Summary & Actions Header */}
        <div className="p-4 bg-secondary/50 border-b border-border flex justify-between items-center">
          <div className="flex gap-6">
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-500">Total Items</span>
              <span className="font-mono text-sm font-semibold">{items.length}</span>
            </div>
            <div>
              <span className="block text-[9px] uppercase font-bold text-slate-500">Total Value</span>
              <span className="font-mono text-sm font-semibold">Rs {calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleSubmit}
              disabled={items.length === 0 || !supplierId || !invoiceNumber || receiveStockMutation.isPending}
              className="bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-transform duration-150 ease-out h-8 text-xs px-4 shadow-sm shadow-primary/20"
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
        <div className="py-3 px-4 bg-secondary/50 border-b border-border/50 flex flex-row items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Incoming Items</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="h-8 text-xs active:scale-[0.97] transition-transform duration-150 ease-out hover:bg-secondary/50"
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
                <div className="grid grid-cols-[3fr_2fr_1fr_1fr_1fr_auto] gap-2 p-2 bg-secondary/50 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="px-2">Product</div>
                  <div>Expiry Date</div>
                  <div>Qty</div>
                  <div>Cost</div>
                  <div>Retail</div>
                  <div></div>
                </div>
                <AnimatePresence>
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="grid grid-cols-[3fr_2fr_1fr_1fr_1fr_auto] gap-2 p-2 items-center border-b border-border/50 last:border-0"
                    >
                      <div>
                        <select
                          className="w-full h-8 px-2 text-xs border border-border rounded-md bg-canvas focus:outline-none focus:ring-1 focus:ring-slate-900 transition-all"
                          value={item.product_id}
                          onChange={(e) => updateItem(item.id, 'product_id', e.target.value)}
                        >
                          <option value="">Select product...</option>
                          {products?.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Input type="date" className="h-8 text-xs px-2" value={item.expiry_date} onChange={(e) => updateItem(item.id, 'expiry_date', e.target.value)} required />
                      </div>
                      <div>
                        <Input type="number" className="h-8 text-xs" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', e.target.value)} />
                      </div>
                      <div>
                        <Input type="number" className="h-8 text-xs" value={item.unit_cost_price} onChange={(e) => updateItem(item.id, 'unit_cost_price', e.target.value)} />
                      </div>
                      <div>
                        <Input type="number" className="h-8 text-xs" value={item.retail_price} onChange={(e) => updateItem(item.id, 'retail_price', e.target.value)} />
                      </div>
                      <div className="flex justify-center pr-2">
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

      <AnimatePresence>
        {isContactDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setIsContactDialogOpen(false)}
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
              className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 tracking-tight">Supplier Directory</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Contact your suppliers directly.</p>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsContactDialogOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-3 bg-slate-50/30">
                {suppliers.length === 0 ? (
                  <div className="text-center p-8 text-sm text-slate-400">No suppliers found in the system.</div>
                ) : (
                  suppliers.map(supplier => (
                    <div key={supplier.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-colors">
                      <div className="flex flex-col min-w-0 pr-4">
                        <span className="font-semibold text-sm text-slate-800 truncate">{supplier.name}</span>
                        {supplier.contact && (
                          <span className="text-xs text-slate-500 truncate mt-0.5">{supplier.contact}</span>
                        )}
                        {!supplier.whatsapp_number && (
                          <span className="text-[10px] text-slate-400 italic mt-1">No WhatsApp number</span>
                        )}
                      </div>
                      
                      <Button
                        variant={supplier.whatsapp_number ? "default" : "outline"}
                        size="sm"
                        disabled={!supplier.whatsapp_number}
                        onClick={() => {
                          if (supplier.whatsapp_number) {
                            let cleanNum = supplier.whatsapp_number.replace(/[^0-9]/g, '');
                            if (cleanNum.startsWith('0') && cleanNum.length === 11) {
                              cleanNum = '92' + cleanNum.substring(1);
                            }
                            // Using api.whatsapp.com is more reliable than wa.me for web routing
                            window.open(`https://api.whatsapp.com/send/?phone=${cleanNum}`, '_blank');
                          }
                        }}
                        className={`shrink-0 h-9 px-3 rounded-lg ${supplier.whatsapp_number ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20' : ''}`}
                      >
                        <MessageCircle className="w-4 h-4 mr-1.5" />
                        <span className="text-xs font-medium">Chat</span>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
