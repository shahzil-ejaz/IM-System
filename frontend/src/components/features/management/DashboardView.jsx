import React from 'react';
import { motion } from 'motion/react';
import { useDashboard } from '../../../hooks/useDashboard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, TrendingUp, Users, DollarSign, Package, Clock, CalendarDays } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export function DashboardView() {
  const {
    salesToday,
    lowStockProducts,
    expiringBatches,
    activeCashiers,
    salesGraphData,
    products,
    selectedProductId,
    setSelectedProductId,
    isLoading
  } = useDashboard();

  const [activeAlertTab, setActiveAlertTab] = React.useState('stock');

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-transparent">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="h-full w-full bg-transparent overflow-y-auto no-scrollbar p-6 selection:bg-emerald-100 selection:text-emerald-900">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Overview Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time metrics and alerts for your inventory operations.</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-12 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Main Column (Metrics & Graph) */}
          <div className="col-span-1 md:col-span-8 flex flex-col gap-6">

            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <motion.div variants={itemVariants} className="h-full">
                <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl shadow-emerald-500/20 border-0 overflow-hidden relative h-full">
                  <div className="absolute right-0 top-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                    <DollarSign className="w-48 h-48" />
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-emerald-50 text-sm font-medium uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Sales Today
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-black tracking-tighter">
                      Rs {salesToday.toFixed(2)}
                    </div>
                    <p className="text-emerald-100 text-xs mt-2 font-medium bg-white/10 w-max px-2 py-0.5 rounded-full backdrop-blur-sm">
                      Closing at midnight
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={itemVariants} className="h-full">
                <Card className="bg-white/80 backdrop-blur-md shadow-sm border-slate-200 h-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-slate-500 text-sm font-medium uppercase tracking-widest flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-500" />
                      Active Cashiers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-slate-900 mb-3">
                      {activeCashiers.length}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeCashiers.length === 0 ? (
                        <span className="text-xs text-slate-400">No active cashiers</span>
                      ) : (
                        activeCashiers.map(c => (
                          <div key={c.id} className="flex items-center gap-1.5 bg-secondary/80 px-2 py-1 rounded-md text-xs font-semibold text-slate-700 border border-border">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            {c.username}
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Sales Graph */}
            <motion.div variants={itemVariants} className="flex-1 min-h-[400px]">
              <Card className="bg-white/80 backdrop-blur-md shadow-sm border-slate-200 h-full flex flex-col">
                <CardHeader className="pb-0 border-b border-slate-100 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6">
                  <div>
                    <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                      Product Sales Trend
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">Revenue over the last 30 days</CardDescription>
                  </div>
                  <div className="w-full sm:w-[250px]">
                    <Select value={selectedProductId?.toString() || 'all'} onValueChange={(val) => setSelectedProductId(val === 'all' ? 'all' : Number(val))}>
                      <SelectTrigger className="h-9 bg-secondary/30 border-border text-xs font-semibold shadow-inner focus:ring-emerald-500">
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs font-bold text-emerald-600">
                          All Products
                        </SelectItem>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id.toString()} className="text-xs">
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pt-2 pb-6 px-2 sm:px-6 min-h-[300px]">
                  {salesGraphData.length === 0 ? (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-400">
                      <TrendingUp className="w-8 h-8 opacity-20 mb-2" />
                      <span className="text-xs font-medium">No sales data available</span>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesGraphData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="date"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          dy={10}
                          minTickGap={20}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#64748b', fontSize: 10 }}
                          tickFormatter={(val) => `Rs ${val}`}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: '500' }}
                          cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="#10b981"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorRevenue)"
                          activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </motion.div>

          </div>

          {/* Right Column (Notifications) */}
          <motion.div variants={itemVariants} className="col-span-1 md:col-span-4 h-[600px] md:h-auto">
            <Card className="bg-white/80 backdrop-blur-md shadow-sm border-slate-200 h-full flex flex-col overflow-hidden">
              <CardHeader className="pb-0 border-b border-slate-100 bg-secondary/50 sticky top-0 z-10 shrink-0">
                <div className="flex flex-col gap-3 pb-3">
                  <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500" />
                      Inventory Alerts
                    </span>
                  </CardTitle>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setActiveAlertTab('stock')}
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                        activeAlertTab === 'stock'
                          ? 'bg-white shadow-sm text-slate-900 border border-slate-200'
                          : 'text-slate-500 hover:bg-black/5 hover:text-slate-700'
                      }`}
                    >
                      Low Stock <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeAlertTab === 'stock' ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'}`}>{lowStockProducts.length}</span>
                    </button>
                    <button
                      onClick={() => setActiveAlertTab('expiry')}
                      className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                        activeAlertTab === 'expiry'
                          ? 'bg-white shadow-sm text-slate-900 border border-slate-200'
                          : 'text-slate-500 hover:bg-black/5 hover:text-slate-700'
                      }`}
                    >
                      Expiry <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${activeAlertTab === 'expiry' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{expiringBatches.length}</span>
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto no-scrollbar p-0">
                {activeAlertTab === 'stock' ? (
                  lowStockProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-2">
                      <Package className="w-10 h-10 opacity-20" />
                      <p className="text-sm font-medium">All stock levels are healthy.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {lowStockProducts.map((product) => (
                        <div key={product.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col gap-2 relative overflow-hidden group cursor-default">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                          <div className="flex justify-between items-start pl-2">
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 leading-tight pr-2 group-hover:text-red-700 transition-colors">{product.name}</h4>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{product.sku}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-end pl-2 mt-1">
                            <div className="bg-red-50 text-red-700 px-2.5 py-1 rounded-md border border-red-100">
                              <span className="text-[10px] font-bold uppercase tracking-wider block leading-none mb-1 opacity-70">Current Balance</span>
                              <span className="text-base font-black leading-none">{product.current_balance}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">Min Alert Limit</span>
                              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{product.min_stock_alert}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  expiringBatches.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 gap-2">
                      <CalendarDays className="w-10 h-10 opacity-20" />
                      <p className="text-sm font-medium">No items expiring soon.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {expiringBatches.map((batch) => (
                        <div key={batch.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col gap-2 relative overflow-hidden group cursor-default">
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${batch.is_expired ? 'bg-red-600' : 'bg-amber-500'}`}></div>
                          <div className="flex justify-between items-start pl-2">
                            <div>
                              <h4 className={`text-sm font-bold leading-tight pr-2 transition-colors ${batch.is_expired ? 'text-red-700' : 'text-slate-900'}`}>{batch.product_name}</h4>
                              <div className="flex gap-2 mt-0.5 items-center">
                                <p className="text-[10px] text-slate-500 font-mono">{batch.product_sku}</p>
                                <span className="text-[9px] text-slate-400 font-mono">#{batch.batch_number || batch.id}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-end pl-2 mt-1">
                            <div className={`px-2.5 py-1 rounded-md border ${batch.is_expired ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider block leading-none mb-1 opacity-70">
                                <Clock className="w-3 h-3" /> {batch.is_expired ? 'Expired' : 'Expiring In'}
                              </span>
                              <span className="text-sm font-black leading-none">{batch.is_expired ? 'EXPIRED' : `${batch.days_left} Days`}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-0.5">Quantity</span>
                              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">{batch.quantity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
