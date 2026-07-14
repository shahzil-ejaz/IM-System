import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProductSuggestionCard({ product, onAdd }) {
  // product shape: { id, name, sku, retail_price, current_balance, batch_id }
  const isOutOfStock = product.current_balance <= 0;

  return (
    <Card 
      className={cn(
        "p-3 flex flex-col justify-between h-28 border border-border transition-all duration-200",
        isOutOfStock 
          ? "bg-slate-50 opacity-60 cursor-not-allowed grayscale" 
          : "bg-surface hover:shadow-md hover:border-slate-300 active:scale-[0.98] cursor-pointer"
      )}
      onClick={() => !isOutOfStock && onAdd(product)}
    >
      <div>
        <h3 className="text-sm font-semibold text-text-primary line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <p className="text-xs text-text-secondary font-mono mt-1">
          SKU: {product.sku}
        </p>
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="font-mono font-bold text-text-primary">
          Rs {parseFloat(product.retail_price || 0).toFixed(2)}
        </span>
        
        <Button 
          size="icon" 
          variant={isOutOfStock ? "outline" : "default"}
          className="h-7 w-7 rounded-full shrink-0"
          disabled={isOutOfStock}
          onClick={(e) => {
            e.stopPropagation();
            if (!isOutOfStock) onAdd(product);
          }}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
}
