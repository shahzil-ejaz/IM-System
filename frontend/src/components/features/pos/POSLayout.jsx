import React, { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useCartStore } from '../../../hooks/useCart';
import { useAuth } from '../../../hooks/useAuth';
import { useScanner } from '../../../hooks/useScanner';
import { useInventory, useCheckout } from '../../../hooks/useInventory';
import { usePOSSettings } from '../../../hooks/usePOSSettings';
import { POSCartRow } from './POSCartRow';
import { useBarcodeScanner } from './useBarcodeScanner';
import { usePopup } from '../../../contexts/PopupContext';
import { ReprintDialog } from './ReprintDialog';
import { ReceiptPrinter } from './ReceiptPrinter';
import { Button } from '@/components/ui/button';
import { Lock, Printer, Archive, MapPin, Store, QrCode, ShoppingCart, Banknote, CreditCard, SplitSquareHorizontal, CheckCircle, Camera, CameraOff, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const playScanBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1000, audioCtx.currentTime); // 1000Hz tone
    gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime); // low volume

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.08); // 80ms beep
  } catch (err) {
    console.warn('Audio beep failed to play:', err);
  }
};

export function POSLayout() {
  const { enableScanner, enableHoldCart, enableReprint } = usePOSSettings();
  const [paymentMethod, setPaymentMethod] = useState('cash'); // NEW STATE
  const [amountPaid, setAmountPaid] = useState(''); // NEW STATE
  const [manualBarcode, setManualBarcode] = useState('');
  const [activeRightPane, setActiveRightPane] = useState('checkout'); // 'checkout' | 'items'
  const [itemsSearchQuery, setItemsSearchQuery] = useState('');
  const [isReprintDialogOpen, setIsReprintDialogOpen] = useState(false);
  const [invoiceToPrint, setInvoiceToPrint] = useState(null);
  const { user, logout } = useAuth();
  const { items, addItem, updateQuantity, removeItem, holdCart, recallCart, heldCart, clearCart, total, subtotal, tax } = useCartStore();
  const { products, batches, isLoadingProducts, isLoadingBatches } = useInventory();
  const checkoutMutation = useCheckout();
  const { showPopup } = usePopup();

  const lastScannedRef = useRef({ code: '', time: 0 });

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
          barcode: product.barcode || null,
          name: product.name || 'Unknown Product',
          retail_price: batch.retail_price || 0,
          tax_rate: product.tax_rate || 0,
          current_balance: batch.quantity,
          max_quantity: batch.quantity,
          batch_number: batch.batch_number,
        };
      });
  }, [products, batches]);

  const allProductsWithInventory = useMemo(() => {
    return products.map(product => {
      const productBatches = batches.filter(b => b.product_id === product.id);
      const totalBalance = productBatches.reduce((sum, b) => sum + b.quantity, 0);
      const retailPrice = productBatches.length > 0 ? productBatches[0].retail_price : 0;
      return {
        ...product,
        totalBalance,
        retailPrice,
      };
    });
  }, [products, batches]);

  const filteredProducts = useMemo(() => {
    if (!itemsSearchQuery.trim()) return allProductsWithInventory;
    const q = itemsSearchQuery.toLowerCase();
    return allProductsWithInventory.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    );
  }, [allProductsWithInventory, itemsSearchQuery]);

  const handleBarcodeScan = useCallback((barcode) => {
    const normalizedBarcode = barcode?.toString().trim();
    if (!normalizedBarcode) return false;

    const now = Date.now();
    // 2 seconds global delay before ANY second item can be scanned to prevent rapid accidental scans
    if (now - lastScannedRef.current.time < 2000) {
      return false;
    }
    lastScannedRef.current = { code: normalizedBarcode, time: now };

    // Always populate the search input with the scanned barcode
    setManualBarcode(normalizedBarcode);

    const matchedItem = batchInventory.find(p =>
      p.sku === normalizedBarcode ||
      p.barcode === normalizedBarcode ||
      p.id.toString() === normalizedBarcode ||
      p.batch_number === normalizedBarcode
    );
    if (matchedItem && matchedItem.current_balance > 0) {
      addItem(matchedItem);
      playScanBeep();
      return true;
    }

    showPopup({
      title: 'Not Found',
      message: `Scanned: "${normalizedBarcode}"\nProduct not found or out of stock.`,
      type: 'error'
    });
    return false;
  }, [addItem, batchInventory, showPopup]);

  const [cameraEnabled, setCameraEnabled] = useState(false);

  const {
    isCameraActive,
    cameraError,
    lastScannedCode,
    scanSuccess,
  } = useBarcodeScanner({
    onScan: handleBarcodeScan,
    enabled: cameraEnabled,
    onClose: () => setCameraEnabled(false),
  });

  useScanner(handleBarcodeScan);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;

    const matchedItem = batchInventory.find(p =>
      p.sku === manualBarcode.trim() ||
      p.barcode === manualBarcode.trim() ||
      p.id.toString() === manualBarcode.trim() ||
      p.batch_number === manualBarcode.trim()
    );
    if (matchedItem && matchedItem.current_balance > 0) {
      addItem(matchedItem);
      setManualBarcode('');
      showPopup({
        title: 'Not Found',
        message: 'Product not found or out of stock!',
        type: 'error'
      });
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
        showPopup({
          title: 'Insufficient Amount',
          message: `Insufficient amount paid! Please enter at least Rs ${total.toFixed(2)}`,
          type: 'error'
        });
        return;
      }
    }

    try {
      const payload = {
        cashier_id: user?.id || 1,
        payment_method: paymentMethod,
        amount_tendered: paymentMethod === 'cash' ? Number(amountPaid) : null,
        change_due: paymentMethod === 'cash' ? Number((Number(amountPaid) - total).toFixed(2)) : null,
        items: items.map(i => ({ batch_id: i.batch_id, quantity: i.quantity }))
      };

      const response = await checkoutMutation.mutateAsync(payload);

      clearCart();
      setAmountPaid('');
      showPopup({
        title: 'Checkout Successful',
        message: `Checkout successful!${paymentMethod === 'cash' ? `\nChange due: Rs ${(Number(amountPaid || total) - total).toFixed(2)}` : ''}`,
        type: 'success'
      });
      handlePrint(response);
    } catch (error) {
      console.error("Checkout failed:", error);
      showPopup({
        title: 'Checkout Failed',
        message: 'Checkout failed. Check network or stock balances.',
        type: 'error'
      });
    }
  };

  const handlePrint = useCallback((invoice) => {
    setInvoiceToPrint(invoice);
    // Give react time to render the receipt before calling print
    setTimeout(() => {
      window.print();
    }, 100);
  }, []);

  return (
    <div className="bg-transparent text-slate-900 min-h-dvh lg:h-dvh lg:overflow-hidden flex flex-col print:bg-white">
      {/* Stitch POS Header */}
      <header className="h-14 lg:h-12 border-b border-border bg-surface/80 backdrop-blur-md px-3 lg:px-4 flex items-center justify-between sticky top-0 z-50 shrink-0 no-print">
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="flex items-center gap-2">

            <span className="font-black text-2xl tracking-tighter hidden sm:inline-block text-slate-800">POS</span>
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
          <button
            onClick={() => setActiveRightPane(prev => prev === 'checkout' ? 'items' : 'checkout')}
            className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 hover:bg-slate-100 rounded-lg transition-colors border border-border"
          >
            {activeRightPane === 'checkout' ? (
              <>
                <Store className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-600" />
                <span className="text-xs lg:text-sm font-semibold hidden sm:inline text-emerald-700">Available Items</span>
              </>
            ) : (
              <>
                <Banknote className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="text-xs lg:text-sm font-semibold hidden sm:inline">View Checkout</span>
              </>
            )}
          </button>
          {enableHoldCart && (
            <button onClick={() => heldCart ? recallCart() : holdCart()} className="flex items-center gap-2 px-3 lg:px-4 py-1.5 lg:py-2 hover:bg-slate-100 rounded-lg transition-colors border border-border">
              <Archive className="w-4 h-4 lg:w-5 lg:h-5" />
              <span className="text-xs lg:text-sm font-semibold hidden sm:inline">{heldCart ? 'Recall Cart' : 'Hold Cart'}</span>
            </button>
          )}
          {enableReprint && (
            <button onClick={() => setIsReprintDialogOpen(true)} className="hidden sm:flex items-center gap-2 px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors border border-border">
              <Printer className="w-5 h-5" />
              <span className="text-sm font-semibold">Reprint</span>
            </button>
          )}
          <button onClick={logout} className="w-8 h-8 lg:w-10 lg:h-10 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg border border-red-100 shrink-0">
            <Lock className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
        </div>
      </header>

      {/* Main Dual-View Workspace */}
      <main className="flex flex-col lg:flex-row flex-1 p-2 lg:p-3 gap-3 min-h-0 no-print">
        {/* Left Side: Cart & Search */}
        <section className="flex-2 flex flex-col gap-3 lg:overflow-hidden">
          <div className="bg-surface rounded-xl p-3 shadow-sm border border-border relative z-20">
            <form onSubmit={handleManualSearch} className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <QrCode className="w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              </div>
              <input
                autoFocus
                className="w-full h-10 pl-10 pr-32 bg-slate-50 border-2 border-border focus:border-slate-500 focus:ring-2 focus:ring-slate-100 rounded-lg text-sm font-medium transition-all outline-none"
                placeholder="Scan Barcode or Type SKU (Enter)"
                type="text"
                value={manualBarcode}
                onChange={(e) => setManualBarcode(e.target.value)}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
                {enableScanner && (
                  <button
                    type="button"
                    onClick={() => {
                      setCameraEnabled(prev => !prev);
                    }}
                    className="flex items-center gap-1 rounded-md border border-border bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {isCameraActive ? <CameraOff className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
                    {isCameraActive ? 'STOP' : 'CAMERA'}
                  </button>
                )}
                <button type="submit" className="bg-slate-700 text-white px-3 py-1 rounded-md font-bold hover:opacity-90 active:scale-[0.97] transition-transform duration-150 ease-out text-xs">
                  SEARCH
                </button>
              </div>
            </form>

            {cameraError && <p className="mt-2 text-[11px] font-medium text-amber-600">{cameraError}</p>}
            {scanSuccess && !cameraError && (
              <p className="mt-2 text-[11px] font-medium text-emerald-600">{scanSuccess}</p>
            )}
            {lastScannedCode && !cameraError && !scanSuccess && (
              <p className="mt-2 text-[11px] font-medium text-emerald-600">Last scan: {lastScannedCode}</p>
            )}

            <div className={`absolute left-0 top-[calc(100%+0.5rem)] z-50 w-full sm:w-[400px] overflow-hidden rounded-lg border border-slate-800 bg-slate-950 p-2 shadow-2xl ${cameraEnabled ? 'block' : 'hidden'}`}>
              <div id="pos-barcode-scanner" className="aspect-video w-full rounded-md bg-black overflow-hidden [&>video]:object-cover [&_video]:[filter:contrast(175%)] [&_video]:scale-x-[-1]" />
              <p className="mt-2 text-[11px] text-slate-300">Point your camera at a barcode and it will be added to the cart automatically.</p>
            </div>
          </div>

          <div className="flex-1 bg-surface rounded-xl border border-border overflow-hidden flex flex-col shadow-sm">
            <div className="px-3 py-2 border-b border-border flex justify-between items-center bg-slate-50/50">
              <h2 className="font-bold text-text-secondary uppercase tracking-wider text-[10px]">Current Transaction</h2>
              <span className="text-[10px] font-medium text-text-secondary">{items.length} Items in Cart</span>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar min-h-75 lg:min-h-0">
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

            {/* <div className="px-3 py-2 bg-slate-50 border-t border-border flex items-center justify-between shrink-0">
              <div className="flex gap-6">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Subtotal</span>
                  <span className="font-mono text-sm font-semibold">Rs {subtotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase">Tax</span>
                  <span className="font-mono text-sm font-semibold">Rs {tax.toFixed(2)}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="block text-[9px] font-bold text-slate-400 uppercase">Total Payable</span>
                <span className="font-mono text-xl font-bold text-slate-900">Rs {total.toFixed(2)}</span>
              </div>
            </div> */}
          </div>
        </section>

        {/* Right Side: Toggleable Pane */}
        <section className="flex-1 flex flex-col gap-3 relative overflow-hidden">
          <div className="bg-surface rounded-xl shadow-xl border border-border flex flex-col flex-1 h-full w-full">
            <AnimatePresence mode="wait">
              {activeRightPane === 'checkout' ? (
                <motion.div
                  key="checkout-pane"
                  initial={{ opacity: 0, x: -20, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: -20, filter: 'blur(2px)' }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="flex flex-col h-full p-4"
                >
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
                      <span>Tax</span>
                      <span className="font-mono font-medium">Rs {tax.toFixed(2)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-border flex justify-between items-end">
                      <span className="font-bold text-sm">TOTAL</span>
                      <span className="font-mono text-2xl font-extrabold text-slate-900">Rs {total.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="space-y-3 flex-1 overflow-y-auto no-scrollbar">
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
                    {/* <button
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
                    </button> */}

                    {paymentMethod === 'cash' && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-4 duration-150 ease-out pb-2">
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
                </motion.div>
              ) : (
                <motion.div
                  key="items-pane"
                  initial={{ opacity: 0, x: 20, filter: 'blur(2px)' }}
                  animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, x: 20, filter: 'blur(2px)' }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="flex flex-col h-full"
                >
                  <div className="p-4 border-b border-border bg-slate-50/50">
                    <h2 className="text-base font-bold mb-3 flex items-center gap-1.5 text-emerald-700">
                      <Store className="w-4 h-4" />
                      Available Items
                    </h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search items by name or SKU..."
                        value={itemsSearchQuery}
                        onChange={(e) => setItemsSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:border-slate-400 focus:ring-1 focus:ring-slate-400 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar p-3">
                    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {filteredProducts.map(product => {
                        const isOutOfStock = product.totalBalance <= 0;
                        return (
                          <div
                            key={product.id}
                            onClick={() => {
                              if (!isOutOfStock) {
                                handleIncrement(product.id);
                                // Optional visual feedback here
                              }
                            }}
                            className={cn(
                              "p-3 border border-border rounded-lg flex flex-col gap-2 transition-all cursor-pointer",
                              isOutOfStock ? "opacity-50 grayscale bg-slate-50 cursor-not-allowed" : "hover:border-emerald-500 hover:shadow-md bg-white active:scale-[0.96]"
                            )}
                          >
                            <div className="flex-1">
                              <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-tight">{product.name}</h3>
                              <p className="text-[10px] text-slate-500 font-mono mt-1">{product.sku}</p>
                            </div>
                            <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100">
                              <div className="text-xs font-semibold text-emerald-600">Rs {Number(product.retailPrice || 0).toFixed(2)}</div>
                              <div className="text-[10px] font-medium text-slate-500">{product.totalBalance} in stock</div>
                            </div>
                          </div>
                        );
                      })}
                      {filteredProducts.length === 0 && (
                        <div className="col-span-full py-12 text-center text-slate-400 text-sm font-medium">
                          No items match your search.
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </main>



      {/* Modals & Hidden Print Container */}
      <ReprintDialog
        open={isReprintDialogOpen}
        onOpenChange={setIsReprintDialogOpen}
        onPrint={handlePrint}
      />
      <ReceiptPrinter invoice={invoiceToPrint} />
    </div>
  );
}
