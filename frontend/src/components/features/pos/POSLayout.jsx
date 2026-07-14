import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore } from '../../../hooks/useCart';
import { useAuth } from '../../../hooks/useAuth';
import { useScanner } from '../../../hooks/useScanner';
import { useInventory, useCheckout } from '../../../hooks/useInventory';
import { POSCartRow } from './POSCartRow';
import { ProductSuggestionCard } from './ProductSuggestionCard';
import { ResponsiveSummaryPanel } from './ResponsiveSummaryPanel';
import { Button } from '@/components/ui/button';
import { PanelRightClose, PanelRightOpen, Lock, Printer, Archive, MapPin } from 'lucide-react';

export function POSLayout() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash'); // NEW STATE
  const [amountPaid, setAmountPaid] = useState(''); // NEW STATE
  const { user, logout } = useAuth();
  const { items, addItem, updateQuantity, removeItem, holdCart, recallCart, heldCart, clearCart, total } = useCartStore();
  const { products, batches, isLoadingProducts, isLoadingBatches } = useInventory();
  const checkoutMutation = useCheckout();

  // Combine products and batches to create searchable active inventory cards
  // Each batch is tracked individually for cart/checkout operations
  const batchInventory = useMemo(() => {
    return batches
      .filter(batch => batch.quantity > 0)          // hide sold-out batches
      .map(batch => {
        const product = products.find(p => p.id === batch.product_id) || {};
        return {
          id: batch.id,
          batch_id: batch.id,
          product_id: product.id,
          sku: product.sku || 'N/A',
          name: product.name || 'Unknown Product',
          retail_price: batch.retail_price || 0,
          current_balance: batch.quantity,          // real live stock count
          max_quantity: batch.quantity,
          batch_number: batch.batch_number,
        };
      });
  }, [products, batches]);

  // Group batches by product for suggestion cards (no duplicates)
  const liveInventory = useMemo(() => {
    const grouped = {};
    for (const item of batchInventory) {
      if (!grouped[item.product_id]) {
        grouped[item.product_id] = {
          ...item,
          current_balance: 0,    // will aggregate below
          max_quantity: 0,
          _batches: [],          // keep refs to individual batches for FIFO selection
        };
      }
      grouped[item.product_id].current_balance += item.current_balance;
      grouped[item.product_id].max_quantity += item.max_quantity;
      grouped[item.product_id]._batches.push(item);
    }
    return Object.values(grouped);
  }, [batchInventory]);

  // Pick the first batch that still has room, then add it to cart
  const handleAddFromSuggestion = (product) => {
    const cartItems = useCartStore.getState().items;
    for (const batch of product._batches) {
      const inCart = cartItems.find(i => i.batch_id === batch.batch_id);
      if ((inCart?.quantity || 0) < batch.current_balance) {
        addItem(batch);
        return;
      }
    }
  };

  // Handle barcode scanner input
  useScanner((barcode) => {
    const matchedItem = batchInventory.find(p => p.sku === barcode || p.id.toString() === barcode || p.batch_number === barcode);
    if (matchedItem && matchedItem.current_balance > 0) {
      addItem(matchedItem);
    }
  });

  const toggleLayout = () => setIsExpanded(!isExpanded);

  const [manualBarcode, setManualBarcode] = useState('');

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    
    const matchedItem = batchInventory.find(p => p.sku === manualBarcode.trim() || p.id.toString() === manualBarcode.trim() || p.batch_number === manualBarcode.trim());
    if (matchedItem && matchedItem.current_balance > 0) {
      addItem(matchedItem);
      setManualBarcode('');
    } else {
      alert('Product not found or out of stock!');
    }
  };

  // Group cart items by product for display (cashier sees one row per product)
  const groupedCartItems = useMemo(() => {
    const grouped = {};
    for (const item of items) {
      if (!grouped[item.product_id]) {
        grouped[item.product_id] = {
          product_id: item.product_id,
          name: item.name,
          sku: item.sku,
          retail_price: item.retail_price,
          totalQuantity: 0,
          totalMax: 0,
        };
      }
      grouped[item.product_id].totalQuantity += item.quantity;
      grouped[item.product_id].totalMax += item.max_quantity;
    }
    return Object.values(grouped);
  }, [items]);

  // Increment: add 1 using FIFO batch selection
  const handleIncrement = (productId) => {
    const productGroup = liveInventory.find(p => p.product_id === productId);
    if (productGroup) handleAddFromSuggestion(productGroup);
  };

  // Decrement: remove 1 from the last batch that has items in cart (LIFO)
  const handleDecrement = (productId) => {
    const productItems = items.filter(i => i.product_id === productId);
    if (productItems.length === 0) return;
    const lastBatch = productItems[productItems.length - 1];
    if (lastBatch.quantity <= 1) {
      removeItem(lastBatch.batch_id);
    } else {
      updateQuantity(lastBatch.batch_id, -1);
    }
  };

  // Remove all batches for this product from cart
  const handleRemoveProduct = (productId) => {
    const productItems = items.filter(i => i.product_id === productId);
    for (const item of productItems) {
      removeItem(item.batch_id);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    if (paymentMethod === 'cash') {
      const paid = Number(amountPaid);
      if (isNaN(paid) || paid < total) {
        alert(`Insufficient amount paid! Please enter at least Rs ${total.toFixed(2)}`);
        return;
      }
    }

    try {
      const payload = {
        cashier_id: user?.id || 1,
        payment_method: paymentMethod,
        items: items.map(i => ({ batch_id: i.batch_id, quantity: i.quantity }))
      };

      await checkoutMutation.mutateAsync(payload);

      clearCart();
      setAmountPaid('');
      alert(`Checkout successful!${paymentMethod === 'cash' ? `\nChange due: Rs ${(Number(amountPaid || total) - total).toFixed(2)}` : ''}`);
    } catch (error) {
      console.error("Checkout failed:", error);
      alert('Checkout failed. Check network or stock balances.');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-canvas overflow-hidden">
      {/* Top Action Drawer Toolbar */}
      <header className="flex items-center justify-between px-4 h-14 bg-surface border-b border-border shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-md">
            <MapPin className="w-4 h-4 text-text-secondary" />
            <span className="text-sm font-medium text-text-primary">Active: Main Warehouse</span>
          </div>
          <span className="text-sm text-text-secondary hidden md:inline">Cashier: <span className="font-semibold text-text-primary">{user?.username || 'Guest'}</span></span>
          <div className="w-px h-6 bg-border mx-2 hidden md:block" />
          <form onSubmit={handleManualSearch} className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Enter Barcode / SKU" 
              className="h-8 px-3 rounded-md border border-input bg-background text-sm w-48 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
            />
            <Button type="submit" size="sm" variant="secondary" className="h-8">Search</Button>
          </form>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => heldCart ? recallCart() : holdCart()}>
            <Archive className="w-4 h-4 mr-2" />
            {heldCart ? 'Recall Cart' : 'Hold Cart'}
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print Last
          </Button>
          <Button variant="ghost" size="icon" onClick={toggleLayout} title="Toggle Suggestions Panel">
            {isExpanded ? <PanelRightOpen className="w-5 h-5" /> : <PanelRightClose className="w-5 h-5" />}
          </Button>
          <div className="w-px h-6 bg-border mx-2" />
          <Button variant="ghost" size="sm" onClick={logout} className="text-red-600 hover:text-red-700 hover:bg-red-50">
            <Lock className="w-4 h-4 mr-2" />
            Lock
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 overflow-hidden">
        {/* Active Cart Section */}
        <section className={`flex flex-col flex-1 bg-surface transition-all duration-300 ease-in-out`}>
          <div className="flex-1 overflow-y-auto no-scrollbar p-0">
            {groupedCartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                <p className="text-lg mb-2">Cart is empty</p>
                <p className="text-sm">Scan an item or select from suggestions</p>
              </div>
            ) : (
              <AnimatePresence>
                {groupedCartItems.map(item => (
                  <motion.div
                    key={item.product_id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <POSCartRow
                      item={item}
                      onIncrement={handleIncrement}
                      onDecrement={handleDecrement}
                      onRemove={handleRemoveProduct}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
          {!isExpanded && (
            <ResponsiveSummaryPanel
              isExpanded={false}
              onProcessCheckout={handleCheckout}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              amountPaid={amountPaid}
              setAmountPaid={setAmountPaid}
            />
          )}
        </section>

        {/* Dynamic Right Side: Either Suggestions or Expanded Checkout Panel */}
        {isExpanded ? (
          <ResponsiveSummaryPanel
            isExpanded={true}
            onProcessCheckout={handleCheckout}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            amountPaid={amountPaid}
            setAmountPaid={setAmountPaid}
          />
        ) : (
          <section className="w-1/2 border-l border-border bg-slate-50/50 flex flex-col shrink-0">
            <div className="p-4 border-b border-border bg-surface shrink-0">
              <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Product Suggestions</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                {liveInventory.map(product => (
                  <ProductSuggestionCard
                    key={product.product_id}
                    product={product}
                    onAdd={handleAddFromSuggestion}
                  />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
