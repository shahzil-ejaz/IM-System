import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Trash2 } from 'lucide-react';

export const POSCartRow = memo(({ item, onIncrement, onDecrement, onRemove }) => {
  // item shape: { product_id, name, sku, retail_price, totalQuantity, totalMax }
  
  const isAtMax = item.totalQuantity >= item.totalMax;

  return (
    <div className="flex items-center justify-between p-2 border-b border-border hover:bg-slate-50 transition-colors gap-2">
      <div className="flex flex-col flex-1 min-w-0 mr-2">
        <span className="font-medium text-sm text-text-primary truncate">{item.name}</span>
        <span className="text-[10px] text-text-secondary font-mono mt-0.5 truncate">SKU: {item.sku}</span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <span className="font-mono font-medium text-xs text-text-primary hidden sm:inline">
          Rs {parseFloat(item.retail_price || 0).toFixed(2)}
        </span>

        <div className="flex items-center gap-1.5 bg-canvas border border-border rounded-md p-0.5">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-sm active:scale-[0.97] transition-transform duration-150 ease-out"
            onClick={() => onDecrement(item.product_id)}
            disabled={item.totalQuantity <= 1}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <span className="font-mono text-sm w-5 text-center">{item.totalQuantity}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6 rounded-sm active:scale-[0.97] transition-transform duration-150 ease-out"
            onClick={() => onIncrement(item.product_id)}
            disabled={isAtMax}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <div className="font-mono font-bold text-sm text-text-primary">
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
