import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { Search, Package, Warehouse, User, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TYPE_CONFIG = {
  purchase: { label: 'Purchase', cls: 'bg-blue-50 text-blue-700 border border-blue-200' },
  sale: { label: 'Sale', cls: 'bg-green-50 text-green-700 border border-green-200' },
  adjustment: { label: 'Adjustment', cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  transfer_in: { label: 'Transfer In', cls: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  transfer_out: { label: 'Transfer Out', cls: 'bg-orange-50 text-orange-700 border border-orange-200' },
  return: { label: 'Return', cls: 'bg-red-50 text-red-700 border border-red-200' },
};

function formatDate(str) {
  if (!str) return '—';
  const dateStr = str.endsWith('Z') ? str : `${str}Z`;
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] || { label: type, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── GROUP ROW (collapsed summary + expandable items) ─────────────────────────
function TransactionGroup({ groupKey, items, isOpen, onToggle }) {
  const first = items[0];
  const totalQty = items.reduce((sum, tx) => sum + tx.quantity, 0);
  const isMulti = items.length > 1;

  return (
    <>
      {/* Summary row */}
      <tr
        className={`border-b border-border/40 transition-colors duration-150 cursor-pointer select-none
          ${isOpen ? 'bg-blue-50/40' : 'hover:bg-slate-50/60'}`}
        onClick={() => isMulti && onToggle()}
      >
        {/* Expand toggle */}
        <td className="px-3 py-2 w-10">
          {isMulti ? (
            <span className="text-text-secondary">
              {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </span>
          ) : (
            <span className="text-text-secondary text-[11px] font-mono">#{first.id}</span>
          )}
        </td>

        {/* Type */}
        <td className="px-3 py-2">
          <TypeBadge type={first.transaction_type} />
        </td>

        {/* Product — "X items" when multi, product name when single */}
        <td className="px-3 py-2">
          {isMulti ? (
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-text-secondary shrink-0" />
              <div>
                <div className="font-medium text-text-primary text-xs">{items.length} items</div>
                <div className="text-[11px] text-text-secondary">Click to expand</div>
              </div>
            </div>
          ) : first.product_name ? (
            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 text-text-secondary shrink-0" />
              <div>
                <div className="font-medium text-text-primary text-xs">{first.product_name}</div>
                <div className="text-[11px] text-text-secondary font-mono">{first.product_sku}</div>
              </div>
            </div>
          ) : (
            <span className="text-text-secondary italic text-[11px]">Unknown</span>
          )}
        </td>

        {/* Batch — only shown for single */}
        <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">
          {isMulti ? '—' : (first.batch_number || `#${first.batch_id}`)}
        </td>

        {/* Warehouse */}
        <td className="px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <Warehouse className="w-3.5 h-3.5 shrink-0" />
            {first.warehouse_name || '—'}
          </div>
        </td>

        {/* Total qty */}
        <td className="px-3 py-2 text-right">
          <span className={`font-mono font-semibold text-xs ${totalQty > 0 ? 'text-green-600' : 'text-red-500'}`}>
            {totalQty > 0 ? '+' : ''}{totalQty}
            {isMulti && <span className="text-[10px] font-normal text-text-secondary ml-1">total</span>}
          </span>
        </td>

        {/* Reference */}
        <td className="px-3 py-2">
          {first.reference_id ? (
            <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="font-mono">{first.reference_id}</span>
            </div>
          ) : '—'}
        </td>

        {/* Actor */}
        <td className="px-3 py-2">
          <div className="flex items-center gap-1.5 text-[11px] text-text-secondary">
            <User className="w-3.5 h-3.5 shrink-0" />
            {first.actor_username || '—'}
          </div>
        </td>

        {/* Date */}
        <td className="px-3 py-2 text-right text-[11px] text-text-secondary whitespace-nowrap">
          {formatDate(first.created_at)}
        </td>
      </tr>

      {/* Expanded child rows */}
      <AnimatePresence>
        {isOpen && isMulti && items.map((tx, idx) => (
          <motion.tr
            key={tx.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, delay: idx * 0.04, ease: 'easeOut' }}
            className="border-b border-border/20 bg-blue-50/20 hover:bg-blue-50/40 transition-colors duration-150"
          >
            {/* Indent marker */}
            <td className="px-3 py-2">
              <span className="font-mono text-[11px] text-text-secondary pl-1.5">#{tx.id}</span>
            </td>
            <td className="px-3 py-2" />
            {/* Product */}
            <td className="px-3 py-2">
              <div className="flex items-center gap-2 pl-3 border-l-2 border-blue-200 ml-1">
                <div>
                  <div className="text-xs font-medium text-text-primary">{tx.product_name || '—'}</div>
                  <div className="text-[11px] text-text-secondary font-mono">{tx.product_sku}</div>
                </div>
              </div>
            </td>
            {/* Batch */}
            <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">
              {tx.batch_number || `#${tx.batch_id}`}
            </td>
            <td className="px-3 py-2" />
            {/* Qty */}
            <td className="px-3 py-2 text-right">
              <span className={`font-mono font-semibold text-[11px] ${tx.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                {tx.quantity > 0 ? '+' : ''}{tx.quantity}
              </span>
            </td>
            <td className="px-3 py-2">
              {tx.notes ? (
                <span className="text-[11px] text-text-secondary italic">{tx.notes}</span>
              ) : '—'}
            </td>
            <td colSpan="2" />
          </motion.tr>
        ))
        }
      </AnimatePresence >
    </>
  );
}

// ─── MAIN VIEW ────────────────────────────────────────────────────────────────
export function StockLedgerView() {
  const [search, setSearch] = useState('');
  const [openGroups, setOpenGroups] = useState({});

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['stock-transactions-enriched'],
    queryFn: () => inventoryService.getStockTransactionsEnriched(),
  });

  // Group by reference_id + transaction_type + date-minute (fallback: each tx is its own group)
  const groups = useMemo(() => {
    const map = new Map();
    for (const tx of transactions) {
      // Group key: reference + type + same minute bucket
      const minuteBucket = tx.created_at ? tx.created_at.slice(0, 16) : tx.id;
      const key = tx.reference_id
        ? `${tx.reference_id}::${tx.transaction_type}::${minuteBucket}`
        : `solo::${tx.id}`;

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(tx);
    }
    return Array.from(map.entries()); // [[key, [tx,...]], ...]
  }, [transactions]);

  // Filter groups: keep group if ANY item matches search
  const q = search.toLowerCase();
  const filteredGroups = q
    ? groups.filter(([, items]) =>
      items.some(tx =>
        (tx.product_name || '').toLowerCase().includes(q) ||
        (tx.product_sku || '').toLowerCase().includes(q) ||
        (tx.batch_number || '').toLowerCase().includes(q) ||
        (tx.transaction_type || '').toLowerCase().includes(q) ||
        (tx.reference_id || '').toLowerCase().includes(q) ||
        (tx.actor_username || '').toLowerCase().includes(q) ||
        (tx.warehouse_name || '').toLowerCase().includes(q)
      )
    )
    : groups;

  const toggleGroup = (key) =>
    setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">Stock Ledger</h1>
          <p className="text-text-secondary text-xs mt-0.5">Read-only historical stream of all inventory movements.</p>
        </div>
        <div className="text-xs text-text-secondary bg-surface border border-border rounded-md px-3 py-1.5 font-medium">
          {groups.length} transactions · {transactions.length} entries
        </div>
      </div>

      {/* Filter */}
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
        <Input
          placeholder="Search product, batch, reference, user…"
          className="pl-8 bg-surface h-8 text-xs"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <Card className="border-border shadow-sm bg-surface/90 backdrop-blur-md">
        <CardHeader className="py-3 px-4 border-b border-border/50 bg-slate-50/50">
          <CardTitle className="text-xs font-bold text-text-secondary uppercase tracking-wider">
            {search ? `${filteredGroups.length} matching groups` : 'All Transactions'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[800px] text-left">
            <thead className="border-b border-border text-[10px] uppercase font-bold tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2 w-10" />
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Product</th>
                <th className="px-3 py-2">Batch</th>
                <th className="px-3 py-2">Warehouse</th>
                <th className="px-3 py-2 text-right">Qty</th>
                <th className="px-3 py-2">Reference / Note</th>
                <th className="px-3 py-2">By</th>
                <th className="px-3 py-2 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="9" className="px-3 py-6 text-center text-xs text-text-secondary">Loading ledger…</td>
                </tr>
              )}
              {!isLoading && filteredGroups.length === 0 && (
                <tr>
                  <td colSpan="9" className="px-3 py-6 text-center text-xs text-text-secondary">
                    {search ? 'No results match your search.' : 'No transactions recorded yet.'}
                  </td>
                </tr>
              )}
              {filteredGroups.map(([key, items]) => (
                <TransactionGroup
                  key={key}
                  groupKey={key}
                  items={items}
                  isOpen={!!openGroups[key]}
                  onToggle={() => toggleGroup(key)}
                />
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
