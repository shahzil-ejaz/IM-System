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
  const { user, logout } = useAuth();
  const { items, addItem, updateQuantity, removeItem, holdCart, recallCart, heldCart, clearCart, discountAmount } = useCartStore();
  const { products, batches, isLoadingProducts, isLoadingBatches } = useInventory();
  const checkoutMutation = useCheckout();

  // Combine products and batches to create searchable active inventory cards
  const liveInventory = useMemo(() => {
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

  // Handle barcode scanner input
  useScanner((barcode) => {
    const matchedItem = liveInventory.find(p => p.sku === barcode || p.id.toString() === barcode || p.batch_number === barcode);
    if (matchedItem && matchedItem.current_balance > 0) {
      addItem(matchedItem);
    }
  });

  const toggleLayout = () => setIsExpanded(!isExpanded);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    
    try {
      const payload = {
        cashier_id: user?.id || 1, // Fallback if user ID missing
        payment_method: paymentMethod, // Now uses active state
        discount_amount: discountAmount,
        items: items.map(i => ({ batch_id: i.batch_id, quantity: i.quantity }))
      };
      
      await checkoutMutation.mutateAsync(payload);
      
      // Success: Clear the cart
      clearCart();
      alert('Checkout successful!'); // Simple feedback
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
          <span className="text-sm text-text-secondary">Cashier: <span className="font-semibold text-text-primary">{user?.username || 'Guest'}</span></span>
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
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-text-secondary">
                <p className="text-lg mb-2">Cart is empty</p>
                <p className="text-sm">Scan an item or select from suggestions</p>
              </div>
            ) : (
              <AnimatePresence>
                {items.map(item => (
                  <motion.div
                    key={item.batch_id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <POSCartRow 
                      item={item} 
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeItem}
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
                    key={product.id} 
                    product={product} 
                    onAdd={addItem} 
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
