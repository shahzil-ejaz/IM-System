import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useInventory, useCheckout } from '../../../hooks/useInventory';
import { useCartStore } from '../../../hooks/useCart';
import { useAuth } from '../../../hooks/useAuth';
import { ShoppingCart, LogOut, Search, Plus, Minus, CreditCard, Banknote, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ReceiptPrinter } from '../pos/ReceiptPrinter';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';

export function SelfOrderLayout() {
  const { products, batches, isLoadingProducts, isLoadingBatches } = useInventory();
  const { items, addItem, updateQuantity, removeItem, clearCart, total, subtotal, tax } = useCartStore();
  const { user, logout } = useAuth();
  const checkoutMutation = useCheckout();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutState, setCheckoutState] = useState('idle'); // idle, processing, success
  const [receiptData, setReceiptData] = useState(null);

  // Clear cart on mount to ensure fresh start
  useEffect(() => {
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    logout();
  };

  // Combine products and their active batches for the grid
  const availableItems = products.map(product => {
    // Find batches with stock > 0 and sort by closest expiry
    const productBatches = batches
      .filter(b => b.product_id === product.id && b.quantity > 0)
      .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
    
    return {
      product,
      activeBatch: productBatches[0] || null,
      totalStock: productBatches.reduce((sum, b) => sum + b.quantity, 0)
    };
  }).filter(item => item.activeBatch && item.product.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddToCart = (item) => {
    const productBatch = {
      ...item.activeBatch,
      batch_id: item.activeBatch.id,
      max_quantity: item.activeBatch.quantity,
      product_id: item.product.id,
      sku: item.product.sku,
      barcode: item.product.barcode,
      name: item.product.name,
      tax_rate: item.product.tax_rate
    };
    addItem(productBatch);
  };

  const handleCheckout = async (method) => {
    if (items.length === 0) return;
    
    setCheckoutState('processing');
    try {
      const payload = {
        cashier_id: user?.id || 1,
        payment_method: method,
        discount_amount: 0,
        items: items.map(i => ({
          batch_id: i.batch_id,
          quantity: i.quantity
        }))
      };

      const result = await checkoutMutation.mutateAsync(payload);
      setReceiptData(result);
      setCheckoutState('success');
      clearCart();
      
      // Give React time to render the receipt before calling print
      setTimeout(() => {
        window.print();
      }, 200);
      
      // Auto close success screen after 6 seconds
      setTimeout(() => {
        setCheckoutState('idle');
        setReceiptData(null);
      }, 6000);

    } catch (error) {
      console.error("Checkout failed:", error);
      setCheckoutState('idle');
    }
  };

  if (checkoutState === 'success' && receiptData) {
    return (
      <>
        <div className="no-print min-h-[100dvh] bg-surface text-text-primary flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
            className="max-w-md w-full bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center text-center border border-border/50"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            >
              <CheckCircle2 className="w-20 h-20 text-emerald-500 mb-6" />
            </motion.div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Order Confirmed</h1>
            <p className="text-text-secondary mb-8">
              {receiptData.payment_method === 'cash'
                ? "Pay cash at the counter."
                : "Proceed to the counter to collect your order."}
            </p>
            
            <div className="bg-surface/50 w-full rounded-xl p-6 border border-border/50 mb-8">
              <p className="text-sm text-text-secondary uppercase tracking-wider mb-1">Order Number</p>
              <p className="text-4xl font-mono font-bold tracking-tight text-emerald-600">
                {receiptData.receipt_number.split('-').pop()}
              </p>
            </div>

            <Button 
              className="w-full h-14 text-lg active:scale-[0.97] transition-transform" 
              onClick={() => { setCheckoutState('idle'); setReceiptData(null); }}
            >
              Start New Order
            </Button>
          </motion.div>
        </div>
        <ReceiptPrinter invoice={receiptData} />
      </>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-background text-text-primary overflow-hidden">
      {/* LEFT COL: Header & Product Grid */}
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden">
        
        {/* Header */}
        <header className="h-20 flex-shrink-0 flex items-center justify-between px-6 lg:px-10 border-b border-border/50 bg-surface/80 backdrop-blur-md z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShoppingCart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Self Order</h1>
              <p className="text-xs text-text-secondary font-medium uppercase tracking-wider">Tap items to add</p>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-8 relative hidden md:block">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 bg-surface border-border/50 rounded-xl text-base focus-visible:ring-emerald-500/30"
            />
          </div>

          <Button variant="ghost" className="h-12 w-12 rounded-xl text-text-muted hover:text-text-primary" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </header>

        {/* Mobile Search */}
        <div className="md:hidden p-4 bg-surface border-b border-border/50 flex-shrink-0">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <Input 
              placeholder="Search products..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-10 bg-background border-border/50 rounded-xl text-base"
            />
          </div>
        </div>

        {/* Product Grid */}
        <main className="flex-1 overflow-y-auto p-3 lg:p-8 custom-scrollbar pb-[65vh] lg:pb-8">
          {isLoadingProducts || isLoadingBatches ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
          ) : (
            <motion.div 
              className="grid grid-cols-[repeat(auto-fill,minmax(130px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3 lg:gap-6"
              initial="hidden"
              animate="show"
              variants={{
                hidden: { opacity: 0 },
                show: {
                  opacity: 1,
                  transition: { staggerChildren: 0.05 }
                }
              }}
            >
              <AnimatePresence mode="popLayout">
                {availableItems.map((item) => (
                  <motion.div
                    key={item.activeBatch.id}
                    layoutId={`product-${item.product.id}`}
                    variants={{
                      hidden: { opacity: 0, scale: 0.9, y: 10 },
                      show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
                    }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => handleAddToCart(item)}
                    className="group relative bg-surface border border-border/50 rounded-2xl p-4 flex flex-col cursor-pointer transition-colors hover:border-emerald-500/30 active:scale-[0.97] overflow-hidden select-none"
                    style={{ transitionProperty: "transform, border-color" }}
                  >
                    {/* Redesigned Typographic Card Without Image */}
                    <div className="w-full aspect-[4/3] rounded-xl mb-4 p-4 flex flex-col justify-between relative overflow-hidden transition-all duration-300">
                      {/* Dynamic background using CSS gradients based on string length/char codes to give each product a unique but consistent feel */}
                      <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-emerald-500 to-teal-900" 
                           style={{ filter: `hue-rotate(${(item.product.name.length * 15) % 360}deg)` }} 
                      />
                      <div className="absolute top-0 right-0 p-3 opacity-20 transform translate-x-1/4 -translate-y-1/4 group-hover:scale-110 transition-transform duration-500">
                        <span className="text-8xl font-black">{item.product.name.charAt(0)}</span>
                      </div>
                      
                      <div className="relative z-10 flex-1 flex flex-col justify-end">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/80 backdrop-blur-sm shadow-sm border border-white/40 flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                          <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700 group-hover:text-white" />
                        </div>
                        <h3 className="font-bold text-sm sm:text-lg text-slate-800 line-clamp-2 leading-tight tracking-tight">
                          {item.product.name}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between px-1 mt-1">
                      <div className="flex flex-col">
                        <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Price</p>
                        <p className="text-base sm:text-xl font-black tracking-tight text-emerald-600">
                          Rs {Number(item.activeBatch.retail_price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>

      {/* RIGHT COL: Cart & Checkout (Fixed Sidebar on Desktop, Sticky Bottom on Mobile) */}
      <aside className="fixed bottom-0 left-0 right-0 lg:relative lg:w-[400px] xl:w-[480px] bg-surface border-t lg:border-t-0 lg:border-l border-border/50 flex flex-col h-auto max-h-[60vh] lg:max-h-none lg:h-[100dvh] shadow-[0_-10px_40px_rgba(0,0,0,0.05)] lg:shadow-none z-20">
        
        <div className="p-3 lg:p-6 border-b border-border/50 bg-surface flex-shrink-0 flex items-center justify-between">
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Your Order</h2>
          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart} className="text-red-500 hover:text-red-600 hover:bg-red-50 px-2 lg:px-3 h-8">
                Clear
              </Button>
            )}
            <span className="bg-background px-3 py-1 rounded-full text-xs lg:text-sm font-semibold border border-border/50">
              {items.reduce((sum, i) => sum + i.quantity, 0)} items
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 lg:p-6 custom-scrollbar flex flex-col">
          <AnimatePresence initial={false}>
            {items.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50"
              >
                <ShoppingCart className="w-16 h-16 text-text-tertiary" />
                <p className="text-text-secondary text-lg">Your cart is empty.<br/>Tap items to add them.</p>
              </motion.div>
            ) : (
              items.map((item) => (
                <motion.div 
                  key={item.batch_id}
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="bg-background rounded-2xl p-4 border border-border/50 flex gap-4 overflow-hidden shrink-0"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-text-primary leading-tight mb-1">{item.name}</h4>
                    <p className="text-emerald-600 font-bold">Rs {Number(item.retail_price).toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-3 bg-surface rounded-xl p-1 border border-border/50 h-10 sm:h-12">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-background text-text-secondary active:scale-90"
                      onClick={() => {
                        if (item.quantity <= 1) {
                          removeItem(item.batch_id);
                        } else {
                          updateQuantity(item.batch_id, -1);
                        }
                      }}
                    >
                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <span className="w-5 sm:w-6 text-center font-bold text-sm sm:text-lg">{item.quantity}</span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg hover:bg-background text-text-secondary active:scale-90"
                      onClick={() => updateQuantity(item.batch_id, 1)}
                    >
                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Checkout Footer - Only show when items are in cart */}
        {items.length > 0 && (
          <div className="bg-surface p-3 lg:p-6 border-t border-border/50 flex-shrink-0">
            <div className="space-y-1 lg:space-y-3 mb-3 lg:mb-6">
              <div className="flex justify-between text-xs lg:text-sm text-text-secondary">
                <span>Subtotal</span>
                <span>Rs {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs lg:text-sm text-text-secondary">
                <span>Tax</span>
                <span>Rs {tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end pt-2 lg:pt-3 border-t border-border/50">
                <span className="font-medium text-sm lg:text-lg">Total</span>
                <span className="text-2xl lg:text-3xl font-bold tracking-tight">Rs {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:gap-3">
              <Button 
                className="h-12 lg:h-16 text-sm lg:text-lg rounded-xl lg:rounded-2xl bg-slate-900 hover:bg-slate-800 text-white active:scale-[0.98] transition-transform flex flex-col gap-1 items-center justify-center relative overflow-hidden group"
                disabled={checkoutState === 'processing'}
                onClick={() => handleCheckout('card')}
              >
                <div className="absolute inset-0 bg-white/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <CreditCard className="w-5 h-5" />
                <span className="text-xs lg:text-sm font-semibold">Pay Card</span>
              </Button>
              
              <Button 
                className="h-12 lg:h-16 text-sm lg:text-lg rounded-xl lg:rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white active:scale-[0.98] transition-transform flex flex-col gap-1 items-center justify-center relative overflow-hidden group"
                disabled={checkoutState === 'processing'}
                onClick={() => handleCheckout('cash')}
              >
                <div className="absolute inset-0 bg-black/10 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <Banknote className="w-5 h-5" />
                <span className="text-xs lg:text-sm font-semibold">Pay Cash</span>
              </Button>
            </div>
          </div>
        )}
      </aside>

    </div>
  );
}
