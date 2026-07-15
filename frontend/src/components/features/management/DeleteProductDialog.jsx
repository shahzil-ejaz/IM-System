import React, { useState } from 'react';
import { useDeleteProduct } from '../../../hooks/useInventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { usePopup } from '../../../contexts/PopupContext';

export function DeleteProductDialog({ product }) {
  const [open, setOpen] = useState(false);
  const deleteProduct = useDeleteProduct();
  const { showPopup } = usePopup();

  const handleDelete = () => {
    deleteProduct.mutate(product.id, {
      onSuccess: () => {
        setOpen(false);
        showPopup({ title: 'Success', message: 'Product deleted successfully!', type: 'success' });
      },
      onError: (err) => {
        showPopup({ title: 'Error', message: err.response?.data?.detail || 'Failed to delete product', type: 'error' });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
          <Trash2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete Product</DialogTitle>
          <DialogDescription className="pt-2 text-text-primary">
            Are you absolutely sure you want to delete <span className="font-bold">{product.name} ({product.sku})</span>?
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 text-sm text-red-600 font-medium">
          <p>⚠️ Warning: This action cannot be undone.</p>
          <p className="mt-1">All batches, historical stock transactions, and sales records associated with this product will also be permanently deleted.</p>
        </div>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={deleteProduct.isPending}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteProduct.isPending} className="bg-red-600 hover:bg-red-700 text-white">
            {deleteProduct.isPending ? 'Deleting...' : 'Delete Permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
