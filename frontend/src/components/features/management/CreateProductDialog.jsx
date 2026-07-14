import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { metadataService } from '../../../services/metadataService';
import { useCreateProduct } from '../../../hooks/useInventory';
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
import { PackageSearch } from 'lucide-react';

export function CreateProductDialog() {
  const [open, setOpen] = useState(false);
  const createProduct = useCreateProduct();
  
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
      category_id: formData.category_id ? Number(formData.category_id) : null,
      brand_id: formData.brand_id ? Number(formData.brand_id) : null,
      unit_id: Number(formData.unit_id),
      tax_rate: Number(formData.tax_rate),
    };

    createProduct.mutate(payload, {
      onSuccess: () => {
        setOpen(false);
        setFormData({
          sku: '',
          barcode: '',
          name: '',
          category_id: '',
          brand_id: '',
          unit_id: '',
          tax_rate: 0,
          min_stock_alert: 10,
        });
      },
    });
  };

  const isFormValid = formData.sku.length >= 3 && formData.name.length >= 2 && formData.unit_id;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><PackageSearch className="w-4 h-4 mr-2" /> New Product</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Product</DialogTitle>
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
            <Button type="submit" disabled={!isFormValid || createProduct.isPending}>
              {createProduct.isPending ? 'Saving...' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
