import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';

export const POSCartRow = memo(({ item, onIncrement, onDecrement, onRemove }) => {
  // item shape: { product_id, name, sku, retail_price, totalQuantity, totalMax }
  
  const isAtMax = item.totalQuantity >= item.totalMax;

  return (
    <div className="flex items-center justify-between p-3 border-b border-border hover:bg-slate-50 transition-colors">
      <div className="flex flex-col max-w-[50%]">
        <span className="font-medium text-text-primary truncate">{item.name}</span>
        <span className="text-xs text-text-secondary font-mono mt-1">SKU: {item.sku}</span>
      </div>

      <div className="flex items-center gap-4">
        <span className="font-mono font-medium text-text-primary">
          Rs {parseFloat(item.retail_price || 0).toFixed(2)}
        </span>

        <div className="flex items-center gap-2 bg-canvas border border-border rounded-md p-0.5">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-sm"
            onClick={() => onDecrement(item.product_id)}
            disabled={item.totalQuantity <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="font-mono text-sm w-6 text-center">{item.totalQuantity}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-sm"
            onClick={() => onIncrement(item.product_id)}
            disabled={isAtMax}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <div className="font-mono font-bold text-base text-text-primary">
          Rs {(parseFloat(item.retail_price || 0) * item.totalQuantity).toFixed(2)}
        </div>

        <Button 
          variant="ghost" 
          size="icon"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          onClick={() => onRemove(item.product_id)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
});

POSCartRow.displayName = 'POSCartRow';
