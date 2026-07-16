import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { metadataService } from '../../../services/metadataService';
import { useUpdateProduct } from '../../../hooks/useInventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil } from 'lucide-react';
import { usePopup } from '../../../contexts/PopupContext';

export function EditProductDialog({ product }) {
  const [open, setOpen] = useState(false);
  const updateProduct = useUpdateProduct();
  const { showPopup } = usePopup();
  
  const [formData, setFormData] = useState({
    sku: '',
    barcode: '',
    name: '',
    category_id: '',
    brand_id: '',
    unit_id: '',
    tax_rate: 0,
    min_stock_alert: 10,
  });

  useEffect(() => {
    if (product && open) {
      setFormData({
        sku: product.sku || '',
        barcode: product.barcode || '',
        name: product.name || '',
        category_id: product.category_id || '',
        brand_id: product.brand_id || '',
        unit_id: product.unit_id || '',
        tax_rate: product.tax_rate || 0,
        min_stock_alert: product.min_stock_alert || 10,
      });
    }
  }, [product, open]);

  const { data: brands = [] } = useQuery({ queryKey: ['metadata', 'brands'], queryFn: metadataService.getBrands });
  const { data: categories = [] } = useQuery({ queryKey: ['metadata', 'categories'], queryFn: metadataService.getCategories });
  const { data: units = [] } = useQuery({ queryKey: ['metadata', 'units'], queryFn: metadataService.getUnits });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      barcode: formData.barcode?.trim() || null,
      category_id: formData.category_id ? Number(formData.category_id) : null,
      brand_id: formData.brand_id ? Number(formData.brand_id) : null,
      unit_id: Number(formData.unit_id),
      tax_rate: Number(formData.tax_rate),
    };

    updateProduct.mutate({ productId: product.id, payload }, {
      onSuccess: () => {
        setOpen(false);
        showPopup({ title: 'Success', message: 'Product updated successfully!', type: 'success' });
      },
      onError: (err) => {
        showPopup({ title: 'Error', message: err.response?.data?.detail || 'Failed to update product', type: 'error' });
      }
    });
  };

  const isFormValid = formData.sku.length >= 3 && formData.name.length >= 2 && formData.unit_id;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">SKU *</label>
              <Input name="sku" value={formData.sku} onChange={handleChange} placeholder="e.g. PRD-001" required minLength={3} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Barcode</label>
              <Input name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Optional" />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Name *</label>
            <Input name="name" value={formData.name} onChange={handleChange} placeholder="Full product name" required minLength={2} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-medium">Brand</label>
              <select 
                name="brand_id" 
                value={formData.brand_id} 
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Brand</option>
                {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-medium">Category</label>
              <select 
                name="category_id" 
                value={formData.category_id} 
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 flex flex-col">
              <label className="text-sm font-medium">Unit *</label>
              <select 
                name="unit_id" 
                value={formData.unit_id} 
                onChange={handleChange}
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select Unit</option>
                {units.map(u => <option key={u.id} value={u.id}>{u.name} ({u.short_name})</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tax Rate (%)</label>
              <Input name="tax_rate" type="number" min="0" step="0.01" value={formData.tax_rate} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Min Alert</label>
              <Input name="min_stock_alert" type="number" min="0" value={formData.min_stock_alert} onChange={handleChange} />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={!isFormValid || updateProduct.isPending}>
              {updateProduct.isPending ? 'Saving...' : 'Update Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
