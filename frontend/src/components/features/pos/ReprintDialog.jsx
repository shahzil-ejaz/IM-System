import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { useInventory } from '../../../hooks/useInventory';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Receipt, RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export function ReprintDialog({ open, onOpenChange, onPrint }) {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const { products, batches } = useInventory();

  const getProductName = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return `Batch #${batchId}`;
    const product = products.find(p => p.id === batch.product_id);
    return product ? product.name : `Batch #${batchId}`;
  };

  const { data: salesInvoices = [], isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['salesInvoices', 'recent'],
    queryFn: () => inventoryService.getSalesInvoices(0, 20),
    enabled: open,
    refetchOnWindowFocus: false
  });

  const sortedInvoices = [...salesInvoices].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const selectedInvoice = sortedInvoices.find(i => i.id === selectedInvoiceId);

  // Clear selection if dialog closes
  React.useEffect(() => {
    if (!open) setSelectedInvoiceId(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] flex flex-col p-0 gap-0 overflow-hidden duration-200 ease-out border border-border shadow-2xl bg-surface sm:rounded-xl">
        <DialogHeader className="p-4 border-b border-border bg-white/80 backdrop-blur-md flex flex-row items-center justify-between space-y-0 sticky top-0 shrink-0 z-10">
          <div>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Receipt className="w-5 h-5 text-emerald-600" />
              Recent Transactions
            </DialogTitle>
            <DialogDescription className="text-xs mt-1">Select a past transaction to reprint the receipt.</DialogDescription>
          </div>
          <button 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="p-2 hover:bg-slate-200 rounded-full transition-colors active:scale-95 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn("w-4 h-4 text-slate-600", isFetching && "animate-spin")} />
          </button>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {/* Left Column: List of Invoices */}
          <div className="w-1/2 border-r border-border overflow-y-auto no-scrollbar bg-slate-50/50">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin" />
                <span className="text-sm font-medium">Loading transactions...</span>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500 p-8 text-center gap-2">
                <span className="text-sm font-medium">Failed to load transactions.</span>
                <Button variant="outline" size="sm" onClick={() => refetch()}>Try Again</Button>
              </div>
            ) : sortedInvoices.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center gap-2">
                <Receipt className="w-8 h-8 opacity-50" />
                <span className="text-sm font-medium">No recent transactions found.</span>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {sortedInvoices.map(invoice => (
                  <button
                    key={invoice.id}
                    onClick={() => setSelectedInvoiceId(invoice.id)}
                    className={cn(
                      "flex flex-col p-4 text-left transition-colors duration-150 ease-out",
                      selectedInvoiceId === invoice.id 
                        ? "bg-white shadow-sm border-l-4 border-l-emerald-500 z-10" 
                        : "border-l-4 border-l-transparent hover:bg-slate-100"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-mono text-xs font-bold text-slate-900">{invoice.receipt_number}</span>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">{invoice.payment_method}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] text-slate-500">{new Date(invoice.created_at).toLocaleString()}</span>
                      <span className="text-sm font-bold text-emerald-700">Rs {Number(invoice.total_amount).toFixed(2)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details & Print Action */}
          <div className="w-1/2 bg-slate-100 flex flex-col items-center justify-center relative overflow-hidden">
            <AnimatePresence mode="wait">
              {selectedInvoice ? (
                <motion.div 
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="w-full h-full flex flex-col p-6"
                >
                  <div className="flex-1 overflow-y-auto no-scrollbar bg-white border border-border shadow-md rounded-xl p-6 mb-4 font-mono text-sm">
                    <h4 className="font-bold text-center text-base border-b border-dashed border-slate-300 pb-3 mb-4 uppercase tracking-widest text-slate-800">
                      {selectedInvoice.receipt_number}
                    </h4>
                    <div className="space-y-1 mb-4 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date:</span>
                        <span className="font-medium text-slate-900">{new Date(selectedInvoice.created_at).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cashier:</span>
                        <span className="font-medium text-slate-900">{selectedInvoice.cashier_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Method:</span>
                        <span className="font-medium text-slate-900 uppercase">{selectedInvoice.payment_method}</span>
                      </div>
                    </div>
                    
                    <div className="text-xs font-medium text-slate-400 mb-2 border-b border-dashed border-slate-300 pb-2 uppercase tracking-wider">Items ({selectedInvoice.items?.length || 0})</div>
                    <div className="space-y-3 mb-6">
                      {selectedInvoice.items?.map(item => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-slate-800 w-2/3 pr-2 font-medium">{getProductName(item.batch_id)} <span className="text-slate-400">x{item.quantity}</span></span>
                          <span className="font-bold text-slate-900 text-right w-1/3">Rs {Number(item.subtotal).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-dashed border-slate-300 pt-2 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal:</span>
                        <span>Rs {Number(selectedInvoice.subtotal).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Tax:</span>
                        <span>Rs {Number(selectedInvoice.tax_amount).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-slate-200">
                        <span>Total:</span>
                        <span>Rs {Number(selectedInvoice.total_amount).toFixed(2)}</span>
                      </div>
                      {selectedInvoice.payment_method === 'cash' && selectedInvoice.amount_tendered != null && (
                        <>
                          <div className="flex justify-between text-slate-500 mt-1">
                            <span>Cash Tendered:</span>
                            <span>Rs {Number(selectedInvoice.amount_tendered).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between font-bold text-sm text-emerald-700">
                            <span>Change Due:</span>
                            <span>Rs {Number(selectedInvoice.change_due).toFixed(2)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <Button 
                    size="lg"
                    className="w-full shadow-lg active:scale-[0.97] transition-all bg-emerald-600 hover:bg-emerald-700 text-white font-bold" 
                    onClick={() => onPrint(selectedInvoice)}
                  >
                    <Printer className="w-5 h-5 mr-2" />
                    Print Receipt
                  </Button>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-slate-400 flex flex-col items-center gap-3 p-6 text-center"
                >
                  <Receipt className="w-12 h-12 opacity-30" />
                  <p className="text-sm font-medium">Select a transaction from the list to view details and reprint its receipt.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
