import React, { forwardRef } from 'react';
import { useInventory } from '../../../hooks/useInventory';

export const ReceiptPrinter = forwardRef(({ invoice }, ref) => {
  const { products, batches } = useInventory();

  if (!invoice) return null;

  const getProductName = (batchId) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch) return 'Unknown Product';
    const product = products.find(p => p.id === batch.product_id);
    return product ? product.name : 'Unknown Product';
  };

  return (
    <div ref={ref} className="hidden print:block print:w-[80mm] print:text-black print:bg-white p-4 font-mono text-sm leading-tight">
      <div className="text-center mb-4">
        <h1 className="font-bold text-xl uppercase mb-1">STITCH IM</h1>
        <p className="text-xs">123 Market Street, City</p>
        <p className="text-xs">Tel: +1 234 567 890</p>
      </div>

      <div className="border-b border-dashed border-black pb-2 mb-2 text-xs">
        <div className="flex justify-between">
          <span>Receipt:</span>
          <span className="font-bold">{invoice.receipt_number}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{new Date(invoice.created_at).toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier ID:</span>
          <span>{invoice.cashier_id}</span>
        </div>
        <div className="flex justify-between">
          <span>Method:</span>
          <span className="uppercase">{invoice.payment_method}</span>
        </div>
      </div>

      <div className="mb-2">
        <div className="flex justify-between font-bold text-xs border-b border-dashed border-black pb-1 mb-1">
          <span className="w-1/2">Item</span>
          <span className="w-1/4 text-center">Qty</span>
          <span className="w-1/4 text-right">Total</span>
        </div>
        {invoice.items?.map((item) => (
          <div key={item.id} className="flex justify-between text-xs mb-1">
            <span className="w-1/2 truncate">{getProductName(item.batch_id)}</span>
            <span className="w-1/4 text-center">{item.quantity}</span>
            <span className="w-1/4 text-right">{Number(item.subtotal).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-black pt-2 mt-2 text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{Number(invoice.subtotal).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax:</span>
          <span>{Number(invoice.tax_amount).toFixed(2)}</span>
        </div>
        {Number(invoice.discount_amount) > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{Number(invoice.discount_amount).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm mt-1">
          <span>TOTAL:</span>
          <span>Rs {Number(invoice.total_amount).toFixed(2)}</span>
        </div>
        {invoice.payment_method === 'cash' && invoice.amount_tendered != null && (
          <>
            <div className="flex justify-between mt-1 text-slate-600">
              <span>Cash Tendered:</span>
              <span>Rs {Number(invoice.amount_tendered).toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Change Due:</span>
              <span>Rs {Number(invoice.change_due).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      <div className="text-center mt-6 text-xs italic">
        <p>Thank you for shopping with us!</p>
        <p>Please come again.</p>
      </div>
    </div>
  );
});

ReceiptPrinter.displayName = 'ReceiptPrinter';
