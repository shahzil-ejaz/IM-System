import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { inventoryService } from '../../../services/inventoryService';
import { Search, Package, Warehouse, User, FileText, FileSpreadsheet, ChevronDown, ChevronRight, Filter, X, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'motion/react';
import { usePopup } from '../../../contexts/PopupContext';

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
          ${isOpen ? 'bg-blue-50/40' : 'hover:bg-secondary/60'}`}
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
  const [typeFilter, setTypeFilter] = useState('all');
  const [exactDate, setExactDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const { showPopup } = usePopup();

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

  // Filter groups
  const q = search.toLowerCase();
  const filteredGroups = groups.filter(([, items]) => {
    const first = items[0];

    if (typeFilter !== 'all' && String(first.transaction_type).toLowerCase() !== typeFilter) {
      return false;
    }

    const tDateStr = first.created_at ? (first.created_at.endsWith('Z') ? first.created_at : `${first.created_at}Z`) : null;
    const tDate = tDateStr ? new Date(tDateStr) : new Date(0);

    if (exactDate) {
      const [y, m, d] = exactDate.split('-');
      const start = new Date(y, m - 1, d, 0, 0, 0);
      const end = new Date(y, m - 1, d, 23, 59, 59, 999);
      if (tDate < start || tDate > end) return false;
    } else {
      if (startDate) {
        const [y, m, d] = startDate.split('-');
        const start = new Date(y, m - 1, d, 0, 0, 0);
        if (tDate < start) return false;
      }

      if (endDate) {
        const [y, m, d] = endDate.split('-');
        const end = new Date(y, m - 1, d, 23, 59, 59, 999);
        if (tDate > end) return false;
      }
    }

    if (q) {
      return items.some(tx =>
        (tx.product_name || '').toLowerCase().includes(q) ||
        (tx.product_sku || '').toLowerCase().includes(q) ||
        (tx.batch_number || '').toLowerCase().includes(q) ||
        (tx.transaction_type || '').toLowerCase().includes(q) ||
        (tx.reference_id || '').toLowerCase().includes(q) ||
        (tx.actor_username || '').toLowerCase().includes(q) ||
        (tx.warehouse_name || '').toLowerCase().includes(q)
      );
    }

    return true;
  });

  const flattenedData = useMemo(() => {
    return filteredGroups.flatMap(([, items]) => items).map(tx => ({
      ID: tx.id,
      Date: formatDate(tx.created_at),
      Type: TYPE_CONFIG[tx.transaction_type]?.label || tx.transaction_type,
      Reference: tx.reference_id || '-',
      Product: tx.product_name || '-',
      SKU: tx.product_sku || '-',
      Category: tx.category_name || '-',
      Brand: tx.brand_name || '-',
      Batch: tx.batch_number || '-',
      'Cost Price': tx.cost_price != null ? `Rs ${tx.cost_price.toFixed(2)}` : '-',
      'Retail Price': tx.retail_price != null ? `Rs ${tx.retail_price.toFixed(2)}` : '-',
      'Tax Rate': tx.tax_rate != null ? `${tx.tax_rate}%` : '-',
      Quantity: tx.quantity,
      Warehouse: tx.warehouse_name || '-',
      User: tx.actor_username || '-',
      Notes: tx.notes || '-',
    }));
  }, [filteredGroups]);

  const handleExportExcel = () => {
    if (flattenedData.length === 0) {
      showPopup({ title: 'Export Failed', message: 'No data to export!', type: 'error' });
      return;
    }
    const ws = XLSX.utils.json_to_sheet(flattenedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stock Ledger");
    XLSX.writeFile(wb, `Stock_Ledger_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportPDF = () => {
    if (flattenedData.length === 0) {
      showPopup({ title: 'Export Failed', message: 'No data to export!', type: 'error' });
      return;
    }
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text("Stock Ledger Export", 14, 15);
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Filtered items: ${flattenedData.length}`, 14, 22);

    const columns = Object.keys(flattenedData[0]);
    const rows = flattenedData.map(obj => columns.map(key => obj[key]));

    autoTable(doc, {
      head: [columns],
      body: rows,
      startY: 25,
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [51, 65, 85] }
    });

    doc.save(`Stock_Ledger_Export_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

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
      <div className="flex justify-between items-center relative w-full">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
          <Input
            placeholder="Search product, batch, reference, user…"
            className="pl-8 bg-surface h-10 text-sm"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="h-10 gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32">
              <DropdownMenuItem onClick={handleExportExcel} className="gap-2 cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="gap-2 cursor-pointer">
                <FileText className="w-4 h-4 text-rose-600" />
                <span>PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={`gap-2 h-10 ${showFilters || typeFilter !== 'all' || exactDate || startDate || endDate ? 'bg-secondary border-border text-primary font-semibold' : 'text-slate-600'}`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {(typeFilter !== 'all' || exactDate || startDate || endDate) && (
              <span className="bg-emerald-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center font-bold">!</span>
            )}
          </Button>
        </div>

        {showFilters && (
          <div className="absolute top-12 right-0 w-[300px] bg-white border border-border shadow-xl rounded-xl p-4 z-50">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-800">Filter Transactions</h3>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowFilters(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Transaction Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full bg-surface h-9 border-border text-xs font-medium">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="sale">Sale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border mt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search Specific Date</label>
                <Input type="date" className="w-full bg-surface h-9 text-xs font-medium" value={exactDate} onChange={e => { setExactDate(e.target.value); setStartDate(''); setEndDate(''); }} />
              </div>

              <div className="text-[10px] text-center text-slate-400 font-bold uppercase my-1">- OR RANGE -</div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">From Date</label>
                  <Input type="date" className="w-full bg-surface h-9 text-xs font-medium" value={startDate} onChange={e => { setStartDate(e.target.value); setExactDate(''); }} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">To Date</label>
                  <Input type="date" className="w-full bg-surface h-9 text-xs font-medium" value={endDate} onChange={e => { setEndDate(e.target.value); setExactDate(''); }} />
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-border flex justify-between items-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 text-slate-500 hover:text-slate-800"
                onClick={() => {
                  setTypeFilter('all');
                  setExactDate('');
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Reset All
              </Button>
              <Button size="sm" className="h-8 text-xs bg-slate-900 text-white" onClick={() => setShowFilters(false)}>
                Apply
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <Card className="border-border shadow-sm bg-surface/90 backdrop-blur-md">
        <CardHeader className="py-3 px-4 border-b border-border/50 bg-secondary/50">
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
