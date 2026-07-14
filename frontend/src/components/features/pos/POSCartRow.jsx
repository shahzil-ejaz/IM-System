import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';

export const POSCartRow = memo(({ item, onUpdateQuantity, onRemove }) => {
  // item shape: { batch_id, name, sku, retail_price, quantity, max_quantity, expiry_date }
  
  const isNearExpiry = item.expiry_date && (new Date(item.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const isAtMax = item.quantity >= item.max_quantity;

  return (
    <div className="flex items-center justify-between p-3 border-b border-border hover:bg-slate-50 transition-colors">
      <div className="flex flex-col max-w-[50%]">
        <span className="font-medium text-text-primary truncate">{item.name}</span>
        <div className="flex items-center gap-2 text-xs text-text-secondary font-mono mt-1">
          <span>SKU: {item.sku}</span>
          <span className="text-gray-300">|</span>
          <span>Batch: {item.batch_number || item.batch_id}</span>
        </div>
        {isNearExpiry && (
          <span className="text-[10px] font-semibold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded mt-1 w-max">
            Expiring Soon: {item.expiry_date}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono font-medium text-text-primary">
          ${parseFloat(item.retail_price || 0).toFixed(2)}
        </span>

        <div className="flex items-center gap-2 bg-canvas border border-border rounded-md p-0.5">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-sm"
            onClick={() => onUpdateQuantity(item.batch_id, -1)}
            disabled={item.quantity <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="font-mono text-sm w-6 text-center">{item.quantity}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-sm"
            onClick={() => onUpdateQuantity(item.batch_id, 1)}
            disabled={isAtMax}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <span className="font-mono font-semibold text-text-primary w-16 text-right">
          ${(parseFloat(item.retail_price || 0) * item.quantity).toFixed(2)}
        </span>

        <Button 
          variant="ghost" 
          size="icon"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={() => onRemove(item.batch_id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

POSCartRow.displayName = 'POSCartRow';
