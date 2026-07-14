import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { inventoryService } from '../../../services/inventoryService';
import api from '../../../services/apiClient';
import { Database, ShoppingCart, Truck, ArrowDownUp, Search, RefreshCw, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TYPE_BADGE = {
  purchase:      { label: 'Purchase',      cls: 'bg-blue-100 text-blue-700' },
  sale:          { label: 'Sale',           cls: 'bg-green-100 text-green-700' },
  adjustment:    { label: 'Adjustment',    cls: 'bg-yellow-100 text-yellow-700' },
  transfer_in:   { label: 'Transfer In',   cls: 'bg-indigo-100 text-indigo-700' },
  transfer_out:  { label: 'Transfer Out',  cls: 'bg-orange-100 text-orange-700' },
  return:        { label: 'Return',         cls: 'bg-red-100 text-red-700' },
};

const STATUS_BADGE = {
  completed: { label: 'Completed', cls: 'bg-green-100 text-green-700' },
  pending:   { label: 'Pending',   cls: 'bg-yellow-100 text-yellow-700' },
  paid:      { label: 'Paid',      cls: 'bg-blue-100 text-blue-700' },
  returned:  { label: 'Returned',  cls: 'bg-red-100 text-red-700' },
  refunded:  { label: 'Refunded',  cls: 'bg-red-100 text-red-700' },
};

function Badge({ map, value }) {
  const entry = map[value] || { label: value, cls: 'bg-gray-100 text-gray-600' };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${entry.cls}`}>
      {entry.label}
    </span>
  );
}

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

function formatCurrency(val) {
  if (val == null) return '—';
  return `Rs ${Number(val).toFixed(2)}`;
}

// ─── LEDGER TAB ─────────────────────────────────────────────────────────────
function LedgerTab() {
  const [search, setSearch] = useState('');
  const { data: transactions = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-transactions'],
    queryFn: () => inventoryService.getStockTransactions(0, 500),
  });

  const filtered = transactions.filter(t =>
    String(t.transaction_type).includes(search.toLowerCase()) ||
    String(t.reference_id || '').toLowerCase().includes(search.toLowerCase()) ||
    String(t.batch_id).includes(search) ||
    String(t.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input placeholder="Filter by type, reference, notes…" className="pl-9 bg-surface" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
        <span className="text-sm text-text-secondary">{filtered.length} entries</span>
      </div>
      <div className="border border-border rounded-lg overflow-hidden bg-surface shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/50 border-b border-border text-xs uppercase text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Batch ID</th>
              <th className="px-4 py-3 font-medium">Warehouse</th>
              <th className="px-4 py-3 font-medium text-right">Qty</th>
              <th className="px-4 py-3 font-medium">Reference</th>
              <th className="px-4 py-3 font-medium">Notes</th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan="8" className="px-4 py-8 text-center text-text-secondary">Loading…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan="8" className="px-4 py-8 text-center text-text-secondary">No transactions found.</td></tr>
            )}
            <AnimatePresence>
              {filtered.map(t => (
                <motion.tr key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">#{t.id}</td>
                  <td className="px-4 py-3"><Badge map={TYPE_BADGE} value={t.transaction_type} /></td>
                  <td className="px-4 py-3 font-mono text-xs">{t.batch_id}</td>
                  <td className="px-4 py-3 font-mono text-xs">{t.warehouse_id}</td>
                  <td className={`px-4 py-3 text-right font-mono font-semibold ${t.quantity > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {t.quantity > 0 ? '+' : ''}{t.quantity}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{t.reference_id || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary text-xs max-w-xs truncate">{t.notes || '—'}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{formatDate(t.created_at)}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── PURCHASE INVOICES TAB ───────────────────────────────────────────────────
function PurchaseInvoicesTab() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data: invoices = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-purchases'],
    queryFn: () => inventoryService.getPurchaseInvoices(0, 500),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => inventoryService.updatePurchaseInvoiceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-purchases'] });
      // also invalidate batches and transactions since returning an invoice deletes batches
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['stock-transactions'] });
    },
    onError: (err) => {
      alert(err.response?.data?.detail || 'Failed to update status');
    }
  });

  const filtered = invoices.filter(inv =>
    inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    String(inv.supplier_id).includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input placeholder="Filter by invoice # or supplier ID…" className="pl-9 bg-surface" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
        <span className="text-sm text-text-secondary">{filtered.length} invoices</span>
      </div>
      <div className="border border-border rounded-lg overflow-hidden bg-surface shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/50 border-b border-border text-xs uppercase text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Invoice #</th>
              <th className="px-4 py-3 font-medium">Supplier ID</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium">Created At</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-text-secondary">Loading…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-text-secondary">No purchase invoices found.</td></tr>
            )}
            <AnimatePresence>
              {filtered.map(inv => (
                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">#{inv.id}</td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{inv.invoice_number}</td>
                  <td className="px-4 py-3 font-mono text-xs">{inv.supplier_id}</td>
                  <td className="px-4 py-3">
                    {inv.status === 'returned' ? (
                      <Badge map={STATUS_BADGE} value={inv.status} />
                    ) : (
                      <select
                        className="text-xs font-medium px-2 py-1 rounded border border-border bg-surface text-text-primary"
                        value={inv.status}
                        onChange={(e) => {
                          if (e.target.value === 'returned' && !window.confirm('Are you sure you want to return this invoice? This will delete the associated batches and stock transactions and cannot be undone.')) {
                            e.target.value = inv.status;
                            return;
                          }
                          updateStatusMutation.mutate({ id: inv.id, status: e.target.value });
                        }}
                        disabled={updateStatusMutation.isPending}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="returned">Returned</option>
                      </select>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-text-primary">{formatCurrency(inv.total_amount)}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{formatDate(inv.created_at)}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SALES INVOICES TAB ──────────────────────────────────────────────────────
function SalesInvoicesTab() {
  const [search, setSearch] = useState('');
  const { data: invoices = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-sales'],
    queryFn: () => inventoryService.getSalesInvoices(0, 500),
  });

  const filtered = invoices.filter(inv =>
    String(inv.receipt_number || '').toLowerCase().includes(search.toLowerCase()) ||
    String(inv.cashier_id).includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input placeholder="Filter by receipt # or cashier ID…" className="pl-9 bg-surface" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
        <span className="text-sm text-text-secondary">{filtered.length} receipts</span>
      </div>
      <div className="border border-border rounded-lg overflow-hidden bg-surface shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/50 border-b border-border text-xs uppercase text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Receipt #</th>
              <th className="px-4 py-3 font-medium">Cashier ID</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium text-right">Subtotal</th>
              <th className="px-4 py-3 font-medium text-right">Tax</th>
              <th className="px-4 py-3 font-medium text-right">Total</th>
              <th className="px-4 py-3 font-medium">Created At</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan="9" className="px-4 py-8 text-center text-text-secondary">Loading…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan="9" className="px-4 py-8 text-center text-text-secondary">No sales records found.</td></tr>
            )}
            <AnimatePresence>
              {filtered.map(inv => (
                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-text-secondary">#{inv.id}</td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{inv.receipt_number}</td>
                  <td className="px-4 py-3 font-mono text-xs">{inv.cashier_id}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">{inv.payment_method}</span>
                  </td>
                  <td className="px-4 py-3"><Badge map={STATUS_BADGE} value={inv.status} /></td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{formatCurrency(inv.subtotal)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs">{formatCurrency(inv.tax_amount)}</td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-text-primary">{formatCurrency(inv.total_amount)}</td>
                  <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{formatDate(inv.created_at)}</td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const ACTION_BADGE = {
  LOGIN_SUCCESS:    { cls: 'bg-green-100 text-green-700' },
  LOGIN_FAILED:     { cls: 'bg-red-100 text-red-700' },
  LOGIN_BLOCKED:    { cls: 'bg-red-100 text-red-700' },
  USER_CREATED:     { cls: 'bg-blue-100 text-blue-700' },
  USER_UPDATED:     { cls: 'bg-indigo-100 text-indigo-700' },
  USER_ACTIVATED:   { cls: 'bg-green-100 text-green-700' },
  USER_DEACTIVATED: { cls: 'bg-orange-100 text-orange-700' },
  BRAND_CREATED:    { cls: 'bg-slate-100 text-slate-700' },
  BRAND_UPDATED:    { cls: 'bg-slate-100 text-slate-700' },
  BRAND_DELETED:    { cls: 'bg-red-100 text-red-700' },
  CATEGORY_CREATED: { cls: 'bg-slate-100 text-slate-700' },
  CATEGORY_UPDATED: { cls: 'bg-slate-100 text-slate-700' },
  CATEGORY_DELETED: { cls: 'bg-red-100 text-red-700' },
  STOCK_RECEIVED:   { cls: 'bg-blue-100 text-blue-700' },
};

function AdminActionsTab() {
  const [search, setSearch] = useState('');
  const { data: logs = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['audit-admin-logs'],
    queryFn: async () => {
      const res = await api.get('/api/audit/', { params: { skip: 0, limit: 500 } });
      return res.data;
    },
  });

  const filtered = logs.filter(log =>
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    (log.actor_username || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.detail || '').toLowerCase().includes(search.toLowerCase()) ||
    (log.resource || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <Input placeholder="Filter by action, actor, or detail…" className="pl-9 bg-surface" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
        </Button>
        <span className="text-sm text-text-secondary">{filtered.length} events</span>
      </div>
      <div className="border border-border rounded-lg overflow-hidden bg-surface shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50/50 border-b border-border text-xs uppercase text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Action</th>
              <th className="px-4 py-3 font-medium">Actor</th>
              <th className="px-4 py-3 font-medium">Resource</th>
              <th className="px-4 py-3 font-medium">Detail</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">IP</th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan="8" className="px-4 py-8 text-center text-text-secondary">Loading…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan="8" className="px-4 py-8 text-center text-text-secondary">No admin events recorded yet. They will appear here as actions are taken.</td></tr>
            )}
            <AnimatePresence>
              {filtered.map(log => {
                const badgeCls = ACTION_BADGE[log.action]?.cls || 'bg-gray-100 text-gray-600';
                return (
                  <motion.tr key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">#{log.id}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeCls}`}>{log.action}</span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold">{log.actor_username || <span className="text-text-secondary italic">system</span>}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary">{log.resource}{log.resource_id ? ` #${log.resource_id}` : ''}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary max-w-xs truncate" title={log.detail}>{log.detail || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{log.status}</span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{log.ip_address || '—'}</td>
                    <td className="px-4 py-3 text-xs text-text-secondary whitespace-nowrap">{formatDate(log.created_at)}</td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN VIEW ───────────────────────────────────────────────────────────────
export function GlobalAuditView() {
  const [activeTab, setActiveTab] = useState('admin');

  const tabs = [
    { id: 'admin',     label: 'Admin Actions',     icon: <ShieldAlert className="w-4 h-4" /> },
    { id: 'ledger',    label: 'Stock Ledger',       icon: <ArrowDownUp className="w-4 h-4" /> },
    { id: 'purchases', label: 'Purchase Invoices',  icon: <Truck className="w-4 h-4" /> },
    { id: 'sales',     label: 'Sales Receipts',     icon: <ShoppingCart className="w-4 h-4" /> },
  ];


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <Database className="w-6 h-6 text-text-secondary" /> Global Audit Log
          </h1>
          <p className="text-text-secondary text-sm mt-1">Complete operational history across all system modules.</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <Card className="w-56 shrink-0 h-fit shadow-sm bg-surface/90 backdrop-blur-md">
          <CardContent className="p-2 flex flex-col gap-1">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                className="justify-start w-full gap-2"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </CardContent>
        </Card>

        {/* Content area */}
        <Card className="flex-1 shadow-sm bg-surface/90 backdrop-blur-md min-w-0">
          <CardHeader className="py-5 border-b border-border/50">
            <CardTitle className="text-lg font-semibold">
              {tabs.find(t => t.id === activeTab)?.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 overflow-x-auto">
            {activeTab === 'admin'     && <AdminActionsTab />}
            {activeTab === 'ledger'    && <LedgerTab />}
            {activeTab === 'purchases' && <PurchaseInvoicesTab />}
            {activeTab === 'sales'     && <SalesInvoicesTab />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
