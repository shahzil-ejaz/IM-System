import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Banknote, SplitSquareHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCartStore } from '../../../hooks/useCart';

export function ResponsiveSummaryPanel({ isExpanded, onProcessCheckout, paymentMethod, setPaymentMethod, amountPaid, setAmountPaid }) {
  const { subtotal, tax, total } = useCartStore();

  if (!isExpanded) {
    // State A: Horizontal Bar at bottom
    return (
      <div className="flex items-center justify-between p-4 bg-surface border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex gap-8">
          <div className="flex flex-col">
            <span className="text-xs text-text-secondary uppercase tracking-wider">Subtotal</span>
            <span className="font-mono text-lg font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-text-secondary uppercase tracking-wider">Tax</span>
            <span className="font-mono text-lg font-medium">${tax.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-xs text-text-secondary uppercase tracking-wider mb-1">Payment Method</span>
            <select
              className="h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="split">Split</option>
            </select>
          </div>
          {paymentMethod === 'cash' && (
            <div className="flex flex-col">
              <span className="text-xs text-text-secondary uppercase tracking-wider mb-1">Amount Paid</span>
              <input
                type="number"
                min="0"
                step="0.01"
                className="h-10 px-3 w-28 rounded-md border border-input bg-background text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
              />
            </div>
          )}
          {paymentMethod === 'cash' && Number(amountPaid) > total && (
            <div className="flex flex-col text-right">
              <span className="text-xs text-green-600 uppercase tracking-wider mb-1">Change</span>
              <span className="font-mono text-xl font-bold text-green-600">${(Number(amountPaid) - total).toFixed(2)}</span>
            </div>
          )}
          <div className="w-px h-10 bg-border mx-2"></div>
          <div className="flex flex-col text-right">
            <span className="text-xs text-text-secondary uppercase tracking-wider">Total Due</span>
            <span className="font-mono text-2xl font-bold text-text-primary">${total.toFixed(2)}</span>
          </div>
          <Button size="lg" className="h-12 px-8 text-base font-semibold" onClick={onProcessCheckout}>
            Checkout
          </Button>
        </div>
      </div>
    );
  }

  // State B: Vertical Sidebar on the right
  return (
    <div className="flex flex-col w-96 h-full bg-surface border-l border-border p-6 shadow-sm shrink-0">
      <h2 className="text-lg font-semibold text-text-primary mb-6">Summary & Actions</h2>

      <div className="space-y-4 flex-1">
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Subtotal</span>
          <span className="font-mono font-medium">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-text-secondary">Tax (15%)</span>
          <span className="font-mono font-medium">${tax.toFixed(2)}</span>
        </div>

        <div className="pt-4 border-t border-border mt-4 flex justify-between items-center">
          <span className="font-semibold text-text-primary uppercase tracking-wide">Total</span>
          <span className="font-mono text-3xl font-bold text-text-primary">${total.toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant={paymentMethod === 'cash' ? 'default' : 'outline'}
            className="h-16 flex flex-col gap-1 transition-all"
            onClick={() => setPaymentMethod('cash')}
          >
            <Banknote className={cn("w-5 h-5", paymentMethod === 'cash' ? 'text-primary-foreground' : 'text-green-600')} />
            <span>Cash</span>
          </Button>
          <Button
            variant={paymentMethod === 'card' ? 'default' : 'outline'}
            className="h-16 flex flex-col gap-1 transition-all"
            onClick={() => setPaymentMethod('card')}
          >
            <CreditCard className={cn("w-5 h-5", paymentMethod === 'card' ? 'text-primary-foreground' : 'text-blue-600')} />
            <span>Card</span>
          </Button>
          <Button
            variant={paymentMethod === 'split' ? 'default' : 'outline'}
            className="col-span-2 h-12 flex items-center justify-center gap-2 transition-all"
            onClick={() => setPaymentMethod('split')}
          >
            <SplitSquareHorizontal className="w-4 h-4" />
            <span>Split Payment</span>
          </Button>
        </div>

        {paymentMethod === 'cash' && (
          <div className="mt-4 p-4 bg-slate-50 border border-border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-text-secondary">Amount Paid:</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-24 h-9 px-2 text-right rounded-md border border-input bg-background font-mono text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
            {Number(amountPaid) > total && (
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-sm font-medium text-green-600">Change Due:</span>
                <span className="font-mono text-lg font-bold text-green-600">${(Number(amountPaid) - total).toFixed(2)}</span>
              </div>
            )}
          </div>
        )}

        <Button size="lg" className="w-full h-14 text-lg font-semibold mt-4" onClick={onProcessCheckout}>
          Process Checkout
        </Button>
      </div>
    </div>
  );
}
