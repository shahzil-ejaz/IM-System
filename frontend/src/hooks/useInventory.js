import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryService } from '../services/inventoryService';
import { posService } from '../services/posService';

export function useInventory() {
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => inventoryService.getProducts(0, 1000)
  });

  const { data: rawBatches = [], isLoading: isLoadingBatches } = useQuery({
    queryKey: ['batches'],
    queryFn: () => inventoryService.getBatches(0, 1000)
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => inventoryService.getStockTransactions(0, 5000)
  });

  const { data: suppliers = [], isLoading: isLoadingSuppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn: () => inventoryService.getSuppliers(0, 500)
  });

  const { data: purchaseInvoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['purchaseInvoices'],
    queryFn: () => inventoryService.getPurchaseInvoices(0, 1000)
  });

  // Calculate live balance per batch using the ledger transactions
  const batches = rawBatches.map(batch => {
    const batchTransactions = transactions.filter(t => t.batch_id === batch.id);
    const quantity = batchTransactions.reduce((sum, t) => sum + t.quantity, 0);
    const max_quantity = batchTransactions
      .filter(t => t.quantity > 0)
      .reduce((sum, t) => sum + t.quantity, 0);
    return { ...batch, quantity, max_quantity };
  });

  return { products, batches, suppliers, purchaseInvoices, isLoadingProducts, isLoadingBatches, isLoadingSuppliers, isLoadingInvoices };
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => inventoryService.createProduct(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, payload }) => inventoryService.updateProduct(productId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId) => inventoryService.deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => posService.checkout(payload),
    onSuccess: () => {
      // Invalidate inventory caches so we see the stock drop immediately
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    }
  });
}
