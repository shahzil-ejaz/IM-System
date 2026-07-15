import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '../../../hooks/useInventory';
import { motion, AnimatePresence } from 'motion/react';
import { PackageSearch, ArrowDownToLine, Archive } from 'lucide-react';
import { CreateProductDialog } from './CreateProductDialog';
import { EditProductDialog } from './EditProductDialog';
import { DeleteProductDialog } from './DeleteProductDialog';
import { useQuery } from '@tanstack/react-query';
import { metadataService } from '../../../services/metadataService';

export function CatalogView() {
  const { products, batches, isLoadingProducts, isLoadingBatches } = useInventory();
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'batches'
  const [showSoldOut, setShowSoldOut] = useState(false);

  const { data: brands = [] } = useQuery({ queryKey: ['metadata', 'brands'], queryFn: metadataService.getBrands });
  const { data: categories = [] } = useQuery({ queryKey: ['metadata', 'categories'], queryFn: metadataService.getCategories });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">Catalog & Batches</h1>
          <p className="text-text-secondary text-xs mt-0.5">Manage product catalog and view active inventory batches.</p>
        </div>
        <div className="flex gap-2">
          {/* <Button variant="outline" className="h-8 text-xs active:scale-[0.97] transition-transform duration-150 ease-out"><ArrowDownToLine className="w-3.5 h-3.5 mr-1.5" /> Export</Button> */}
          <CreateProductDialog />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Card className="w-full shrink-0 h-fit shadow-sm bg-surface/90 backdrop-blur-md">
          <CardContent className="p-1.5 flex flex-row gap-0.5 overflow-x-auto no-scrollbar">
            <Button
              variant={activeTab === 'products' ? 'secondary' : 'ghost'}
              className="justify-start whitespace-nowrap transition-transform duration-150 ease-out active:scale-[0.98] h-8 text-xs px-3"
              onClick={() => setActiveTab('products')}
            >
              <PackageSearch className="w-3.5 h-3.5 mr-2" /> Master Catalog
            </Button>
            <Button
              variant={activeTab === 'batches' ? 'secondary' : 'ghost'}
              className="justify-start whitespace-nowrap transition-transform duration-150 ease-out active:scale-[0.98] h-8 text-xs px-3"
              onClick={() => setActiveTab('batches')}
            >
              <Archive className="w-3.5 h-3.5 mr-2" /> Active Batches
            </Button>
          </CardContent>
        </Card>

        <Card className="flex-1 shadow-sm bg-surface/90 backdrop-blur-md overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold capitalize">{activeTab}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeTab === 'products' ? (
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full min-w-[600px] text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-border text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Brand</th>
                      <th className="px-3 py-2">Category</th>
                      <th className="px-3 py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {products.map((p) => (
                        <motion.tr
                          key={p.id}
                          layout
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 transition-colors duration-150"
                        >
                          <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">{p.sku}</td>
                          <td className="px-3 py-2 text-xs font-medium">{p.name}</td>
                          <td className="px-3 py-2 text-xs">{brands.find(b => b.id === p.brand_id)?.name || p.brand_id || '—'}</td>
                          <td className="px-3 py-2 text-xs">{categories.find(c => c.id === p.category_id)?.name || p.category_id || '—'}</td>
                          <td className="px-3 py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <EditProductDialog product={p} />
                              <DeleteProductDialog product={p} />
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {products.length === 0 && !isLoadingProducts && (
                      <tr>
                        <td colSpan="4" className="px-3 py-6 text-center text-xs text-text-secondary">No products found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (() => {
              const activeBatches = batches.filter(b => b.quantity > 0);
              const soldOutBatches = batches.filter(b => b.quantity <= 0);

              return (
                <div>
                  {/* Active Batches */}
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full min-w-[600px] text-sm text-left">
                      <thead className="bg-slate-50/50 border-b border-border text-[10px] uppercase font-bold tracking-wider text-slate-500">
                        <tr>
                          <th className="px-3 py-2">Batch #</th>
                          <th className="px-3 py-2">Product</th>
                          <th className="px-3 py-2 text-right">Qty</th>
                          <th className="px-3 py-2 text-right">Retail (Rs)</th>
                          <th className="px-3 py-2 text-right">Cost (Rs)</th>
                          <th className="px-3 py-2">Expiry</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {activeBatches.map(b => (
                            <motion.tr
                              key={b.id}
                              layout
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.15, ease: 'easeOut' }}
                              className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 transition-colors duration-150"
                            >
                              <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">{b.batch_number}</td>
                              <td className="px-3 py-2 text-xs font-medium">{products.find(p => p.id === b.product_id)?.name || b.product_id}</td>
                              <td className="px-3 py-2 text-xs text-right font-mono">{b.quantity} / {b.max_quantity}</td>
                              <td className="px-3 py-2 text-xs text-right font-mono">Rs {parseFloat(b.retail_price || 0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-xs text-right font-mono">Rs {parseFloat(b.cost_price || 0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-xs text-text-secondary">{b.expiry_date || '—'}</td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                        {activeBatches.length === 0 && (
                          <tr>
                            <td colSpan="6" className="px-3 py-6 text-center text-xs text-text-secondary">No active batches.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Sold Out Section */}
                  <div className="border-t border-border bg-slate-50/30">
                    <button
                      onClick={() => setShowSoldOut(!showSoldOut)}
                      className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-slate-50 transition-colors active:scale-[0.99]"
                    >
                      <span className="flex items-center gap-2">
                        <span className="font-medium">Sold Out Batches</span>
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-mono">{soldOutBatches.length}</span>
                      </span>
                      <motion.span
                        animate={{ rotate: showSoldOut ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-text-secondary"
                      >
                        ▼
                      </motion.span>
                    </button>
                    <AnimatePresence>
                      {showSoldOut && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="overflow-x-auto no-scrollbar">
                            <table className="w-full min-w-[600px] text-sm text-left">
                              <thead className="bg-slate-50/50 border-b border-border text-[10px] uppercase font-bold tracking-wider text-slate-500">
                                <tr>
                                  <th className="px-3 py-2">Batch #</th>
                                  <th className="px-3 py-2">Product</th>
                                  <th className="px-3 py-2 text-right">Qty</th>
                                  <th className="px-3 py-2 text-right">Retail (Rs)</th>
                                  <th className="px-3 py-2 text-right">Cost (Rs)</th>
                                  <th className="px-3 py-2">Expiry</th>
                                </tr>
                              </thead>
                              <tbody>
                                {soldOutBatches.map((b) => (
                                  <motion.tr
                                    key={b.id}
                                    initial={{ opacity: 0, scale: 0.98 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 transition-colors duration-150 opacity-60"
                                  >
                                    <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">{b.batch_number}</td>
                                    <td className="px-3 py-2 text-xs font-medium">{products.find(p => p.id === b.product_id)?.name || b.product_id}</td>
                                    <td className="px-3 py-2 text-xs text-right font-mono text-red-500">0 / {b.max_quantity}</td>
                                    <td className="px-3 py-2 text-xs text-right font-mono">Rs {parseFloat(b.retail_price || 0).toFixed(2)}</td>
                                    <td className="px-3 py-2 text-xs text-right font-mono">Rs {parseFloat(b.cost_price || 0).toFixed(2)}</td>
                                    <td className="px-3 py-2 text-xs text-text-secondary">{b.expiry_date || '—'}</td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
