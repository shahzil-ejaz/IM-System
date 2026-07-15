import { create } from 'zustand';

// Calculate totals based on cart items
const calculateTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.retail_price * item.quantity), 0);
  // Calculate tax per item based on its specific tax_rate
  const tax = items.reduce((sum, item) => {
    const rate = Number(item.tax_rate) || 0;
    // tax_rate is stored as a percentage (e.g. 15 for 15%)
    return sum + (item.retail_price * item.quantity * (rate / 100));
  }, 0);
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

export const useCartStore = create((set, get) => ({
  items: [],
  taxRate: 0.15, // Defaulting to 15% as per requirements example
  heldCart: null,
  subtotal: 0,
  tax: 0,
  total: 0,

  // Actions
  addItem: (productBatch) => set((state) => {
    // productBatch should contain: batch_id, product_id, sku, barcode, name, retail_price, max_quantity
    const existingItem = state.items.find(i => i.batch_id === productBatch.batch_id);
    
    let newItems;
    if (existingItem) {
      if (existingItem.quantity >= productBatch.max_quantity) return state; // Don't exceed stock
      newItems = state.items.map(i => 
        i.batch_id === productBatch.batch_id 
          ? { ...i, quantity: i.quantity + 1 }
          : i
      );
    } else {
      newItems = [...state.items, { ...productBatch, quantity: 1 }];
    }

    return { items: newItems, ...calculateTotals(newItems) };
  }),

  updateQuantity: (batchId, delta) => set((state) => {
    let newItems = state.items.map(i => {
      if (i.batch_id === batchId) {
        const newQty = i.quantity + delta;
        // Don't go below 1 (use removeItem to delete), and don't exceed max_quantity
        if (newQty > 0 && newQty <= i.max_quantity) {
          return { ...i, quantity: newQty };
        }
      }
      return i;
    });

    return { items: newItems, ...calculateTotals(newItems) };
  }),

  removeItem: (batchId) => set((state) => {
    const newItems = state.items.filter(i => i.batch_id !== batchId);
    return { items: newItems, ...calculateTotals(newItems) };
  }),

  clearCart: () => set((state) => ({
    items: [],
    ...calculateTotals([])
  })),

  // Hold / Recall features
  holdCart: () => set((state) => {
    if (state.items.length === 0) return state;
    return {
      heldCart: { items: state.items },
      items: [],
      ...calculateTotals([])
    };
  }),

  recallCart: () => set((state) => {
    if (!state.heldCart) return state;
    return {
      items: state.heldCart.items,
      heldCart: null,
      ...calculateTotals(state.heldCart.items)
    };
  })
}));
