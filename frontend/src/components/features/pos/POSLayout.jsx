import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore } from '../../../hooks/useCart';
import { useAuth } from '../../../hooks/useAuth';
import { useScanner } from '../../../hooks/useScanner';
import { useInventory, useCheckout } from '../../../hooks/useInventory';
import { POSCartRow } from './POSCartRow';
import { Button } from '@/components/ui/button';
import { Lock, Printer, Archive, MapPin, Store, QrCode, ShoppingCart, Banknote, CreditCard, SplitSquareHorizontal, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function POSLayout() {
  const [paymentMethod, setPaymentMethod] = useState('cash'); // NEW STATE
  const [amountPaid, setAmountPaid] = useState(''); // NEW STATE
  const { user, logout } = useAuth();
  const { items, addItem, updateQuantity, removeItem, holdCart, recallCart, heldCart, clearCart, total, subtotal, tax } = useCartStore();
  const { products, batches, isLoadingProducts, isLoadingBatches } = useInventory();
  const checkoutMutation = useCheckout();

  // Combine products and batches to create searchable active inventory cards
  const batchInventory = useMemo(() => {
    return batches
      .filter(batch => batch.quantity > 0)
      .map(batch => {
        const product = products.find(p => p.id === batch.product_id) || {};
        return {
          id: batch.id,
          batch_id: batch.id,
          product_id: product.id,
          sku: product.sku || 'N/A',
          name: product.name || 'Unknown Product',
          retail_price: batch.retail_price || 0,
          current_balance: batch.quantity,
          max_quantity: batch.quantity,
          batch_number: batch.batch_number,
        };
      });
  }, [products, batches]);

  useScanner((barcode) => {
    const matchedItem = batchInventory.find(p => p.sku === barcode || p.id.toString() === barcode || p.batch_number === barcode);
    if (matchedItem && matchedItem.current_balance > 0) {
      addItem(matchedItem);
    }
  });

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

  // Group cart items by product for display
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

  const handleIncrement = (productId) => {
    const cartItems = useCartStore.getState().items;
    const availableBatches = batchInventory.filter(b => b.product_id === productId);

    for (const batch of availableBatches) {
      const inCart = cartItems.find(i => i.batch_id === batch.batch_id);
      if ((inCart?.quantity || 0) < batch.current_balance) {
        addItem(batch);
        return;
      }
    }
  };

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
    <div className="bg-canvas text-slate-900 min-h-[100dvh] lg:h-[100dvh] lg:overflow-hidden flex flex-col">
      {/* Stitch POS Header */}
      <header className="h-14 lg:h-12 border-b border-border bg-surface/80 backdrop-blur-md px-3 lg:px-4 flex items-center justify-between sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex items-center gap-2">

            <span className="font-bold text-sm tracking-tight hidden sm:inline-block">POS</span>
          </div>
          <div className="h-6 w-px bg-border hidden lg:block"></div>
          <div className="hidden lg:flex items-center gap-4 text-sm font-medium">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Main Warehouse
            </div>
            <div className="text-text-secondary">Cashier: <span className="text-text-primary font-semibold">{user?.username || 'Guest'}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <button onClick={() => heldCart ? recallCart() : holdCart()} className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 hover:bg-slate-100 rounded-lg transition-colors border border-border">
            <Archive className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="text-xs lg:text-sm font-semibold hidden sm:inline">{heldCart ? 'Recall Cart' : 'Hold Cart'}</span>
          </button>
          <button className="hidden sm:flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors border border-border">
            <Printer className="w-5 h-5" />
            <span className="text-sm font-semibold">Reprint</span>
          </button>
          <button onClick={logout} className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg border border-red-100 shrink-0">
            <Lock className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
        </div>
      </header>

      {/* Main Dual-View Workspace */}
      <main className="flex flex-col lg:flex-row flex-1 p-2 lg:p-3 gap-3 min-h-0">
        {/* Left Side: Cart & Search */}
        <section className="flex-[2] flex flex-col gap-3 lg:overflow-hidden">
          <div className="bg-surface rounded-xl p-3 shadow-sm border border-border">
            <form onSubmit={handleManualSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <QrCode className="w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              </div>
              <input
                autoFocus
                className="w-full h-10 pl-10 pr-24 bg-slate-50 border-2 border-border focus:border-slate-500 focus:ring-2 focus:ring-slate-100 rounded-lg text-sm font-medium transition-all outline-none"
                placeholder="Scan Barcode or Type SKU (Enter)"
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 bg-surface border border-border rounded text-[10px] text-text-secondary font-mono">ENTER</kbd>
                <button type="submit" className="bg-slate-700 text-white px-3 py-1 rounded-md font-bold hover:opacity-90 active:scale-[0.97] transition-transform duration-150 ease-out text-xs">
                  SEARCH
                </button>
              </div>
            </form>
          </div>

          <div className="flex-1 bg-surface rounded-xl border border-border overflow-hidden flex flex-col shadow-sm">
            <div className="px-3 py-2 border-b border-border flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-text-secondary uppercase tracking-wider text-[10px]">Current Transaction</h2>
              <span className="text-[10px] font-medium text-text-secondary">{items.length} Items in Cart</span>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar min-h-[300px] lg:min-h-0">
              {groupedCartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4 border-2 border-surface shadow-inner">
                    <ShoppingCart className="w-6 h-6 text-slate-300" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-1">Cart is empty</h3>
                  <p className="text-xs text-text-secondary max-w-xs">Scan an item or select from product suggestions to begin the transaction.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {groupedCartItems.map(item => (
                    <motion.div
                      key={item.product_id}
                      layout
                      initial={{ opacity: 0, y: 5, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
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

            <div className="px-3 py-2 bg-slate-50 border-t border-border flex items-center justify-between shrink-0">
              <div className="flex gap-6">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Subtotal</span>
                  <span className="font-mono text-sm font-semibold">Rs {subtotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Tax (15%)</span>
                  <span className="font-mono text-sm font-semibold">Rs {tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Total Payable</span>
                <span className="font-mono text-xl font-bold text-slate-900">Rs {total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Checkout */}
        <section className="flex-1 flex flex-col gap-3">
          <div className="bg-surface rounded-xl p-4 shadow-xl border border-border flex flex-col flex-1">
            <h2 className="text-base font-bold mb-3 flex items-center gap-1.5">
              <Banknote className="w-4 h-4" />
              Checkout
            </h2>
            <div className="space-y-1.5 mb-4">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Subtotal</span>
                <span className="font-mono font-medium">Rs {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Tax (15%)</span>
                <span className="font-mono font-medium">Rs {tax.toFixed(2)}</span>
              </div>
              <div className="pt-1.5 border-t border-border flex justify-between items-end">
                <span className="font-bold text-sm">TOTAL</span>
                <span className="font-mono text-2xl font-extrabold text-slate-900">Rs {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-3 flex-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Payment Method</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border-2 transition-all duration-150 ease-out group active:scale-[0.98]",
                    paymentMethod === 'cash'
                      ? "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-200"
                      : "border-border bg-slate-50 hover:border-slate-300 text-slate-600"
                  )}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote className={cn("w-5 h-5", paymentMethod === 'cash' ? "text-white" : "text-slate-400 group-hover:text-slate-900 transition-colors")} />
                  <span className="font-bold text-xs">Cash</span>
                </button>

                <button
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-lg border-2 transition-all duration-150 ease-out group active:scale-[0.98]",
                    paymentMethod === 'card'
                      ? "border-slate-900 bg-slate-900 text-white shadow-md shadow-slate-200"
                      : "border-border bg-slate-50 hover:border-slate-300 text-slate-600"
                  )}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className={cn("w-5 h-5", paymentMethod === 'card' ? "text-white" : "text-slate-400 group-hover:text-slate-900 transition-colors")} />
                  <span className="font-bold text-xs">Card</span>
                </button>
              </div>
              <button
                className={cn(
                  "w-full flex items-center justify-center p-2 rounded-lg border-2 transition-all duration-150 ease-out group active:scale-[0.98]",
                  paymentMethod === 'split'
                    ? "border-slate-900 bg-slate-900 text-white"
                    : "border-border bg-surface hover:bg-slate-50 text-slate-700"
                )}
                onClick={() => setPaymentMethod('split')}
              >
                <div className="flex items-center gap-2">
                  <SplitSquareHorizontal className={cn("w-3.5 h-3.5", paymentMethod === 'split' ? "text-white" : "text-slate-400 group-hover:text-slate-900")} />
                  <span className="font-semibold text-xs">Split Payment</span>
                </div>
              </button>

              {paymentMethod === 'cash' && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-4 duration-150 ease-out">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase">Amount Tendered</label>
                    {Number(amountPaid) > total && (
                      <span className="text-[9px] font-bold text-emerald-600">Change: Rs {(Number(amountPaid) - total).toFixed(2)}</span>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-slate-400 text-sm">Rs</span>
                    <input
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border-2 border-border rounded-lg font-mono text-lg font-bold focus:border-slate-900 focus:ring-2 focus:ring-slate-100 outline-none transition-all"
                      placeholder="0.00"
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.97] text-white rounded-lg font-bold text-base shadow-lg shadow-emerald-200 transition-all duration-150 ease-out flex items-center justify-center gap-2 disabled:opacity-50 disabled:active:scale-100 shrink-0"
              onClick={handleCheckout}
            >
              <CheckCircle className="w-4 h-4" />
              Process Checkout
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
