import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInventory } from '../../../hooks/useInventory';
import { motion, AnimatePresence } from 'motion/react';
import { PackageSearch, ArrowDownToLine, Archive } from 'lucide-react';
import { CreateProductDialog } from './CreateProductDialog';

export function CatalogView() {
  const { products, batches, isLoadingProducts, isLoadingBatches } = useInventory();
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'batches'

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Catalog & Batches</h1>
          <p className="text-text-secondary text-sm mt-1">Manage product catalog and view active inventory batches.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline"><ArrowDownToLine className="w-4 h-4 mr-2" /> Export</Button>
          <CreateProductDialog />
        </div>
      </div>

      <div className="flex gap-6">
        <Card className="w-64 shrink-0 h-fit shadow-sm bg-surface/90 backdrop-blur-md">
          <CardContent className="p-2 flex flex-col gap-1">
            <Button
              variant={activeTab === 'products' ? 'secondary' : 'ghost'}
              className="justify-start w-full transition-all"
              onClick={() => setActiveTab('products')}
            >
              <PackageSearch className="w-4 h-4 mr-2" /> Master Catalog
            </Button>
            <Button
              variant={activeTab === 'batches' ? 'secondary' : 'ghost'}
              className="justify-start w-full transition-all"
              onClick={() => setActiveTab('batches')}
            >
              <Archive className="w-4 h-4 mr-2" /> Active Batches
            </Button>
          </CardContent>
        </Card>

        <Card className="flex-1 shadow-sm bg-surface/90 backdrop-blur-md">
          <CardHeader className="py-5 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-semibold capitalize">{activeTab}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {activeTab === 'products' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-border text-xs uppercase text-text-secondary">
                    <tr>
                      <th className="px-6 py-4 font-medium">SKU</th>
                      <th className="px-6 py-4 font-medium">Name</th>
                      <th className="px-6 py-4 font-medium">Brand</th>
                      <th className="px-6 py-4 font-medium">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {products.map((p) => (
                        <motion.tr 
                          key={p.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-3 font-mono text-xs">{p.sku}</td>
                          <td className="px-6 py-3 font-medium">{p.name}</td>
                          <td className="px-6 py-3">{p.brand_id}</td>
                          <td className="px-6 py-3">{p.category_id}</td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {products.length === 0 && !isLoadingProducts && (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-text-secondary">No products found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50/50 border-b border-border text-xs uppercase text-text-secondary">
                    <tr>
                      <th className="px-6 py-4 font-medium">Batch #</th>
                      <th className="px-6 py-4 font-medium">Product ID</th>
                      <th className="px-6 py-4 font-medium text-right">Qty</th>
                      <th className="px-6 py-4 font-medium text-right">Retail ($)</th>
                      <th className="px-6 py-4 font-medium text-right">Cost ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {batches.map((b) => (
                        <motion.tr 
                          key={b.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="px-6 py-3 font-mono text-xs">{b.batch_number}</td>
                          <td className="px-6 py-3">{b.product_id}</td>
                          <td className="px-6 py-3 text-right font-mono">{b.quantity || 0}</td>
                          <td className="px-6 py-3 text-right font-mono">${parseFloat(b.retail_price || 0).toFixed(2)}</td>
                          <td className="px-6 py-3 text-right font-mono">${parseFloat(b.cost_price || 0).toFixed(2)}</td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {batches.length === 0 && !isLoadingBatches && (
                      <tr>
                        <td colSpan="5" className="px-6 py-8 text-center text-text-secondary">No active batches.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
