import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../../../hooks/useAuth';
import { metadataService } from '../../../services/metadataService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

function MetadataTable({ type, fetchFn, createFn, deleteFn }) {
  const queryClient = useQueryClient();
  const [newValue, setNewValue] = useState('');
  const [newSecondary, setNewSecondary] = useState('');
  
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['metadata', type],
    queryFn: fetchFn
  });

  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata', type] });
      setNewValue('');
      setNewSecondary('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata', type] });
    }
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    
    if (type === 'units') {
      if (!newSecondary.trim()) return;
      createMutation.mutate({ name: newValue, short_name: newSecondary });
    } else if (type === 'suppliers') {
      createMutation.mutate({ name: newValue, contact: newSecondary });
    } else if (type === 'warehouses') {
      createMutation.mutate({ name: newValue, location: newSecondary });
    } else {
      createMutation.mutate({ name: newValue });
    }
  };

  const hasSecondaryField = ['units', 'suppliers', 'warehouses'].includes(type);
  const isFormValid = hasSecondaryField ? newValue.trim() && (type === 'units' ? newSecondary.trim() : true) : newValue.trim();

  const getSecondaryPlaceholder = () => {
    if (type === 'units') return "Short name (e.g. kg, pcs)...";
    if (type === 'suppliers') return "Contact info (optional)...";
    if (type === 'warehouses') return "Location (optional)...";
    return "";
  };

  const getSecondaryHeader = () => {
    if (type === 'units') return "Short Name";
    if (type === 'suppliers') return "Contact";
    if (type === 'warehouses') return "Location";
    return "";
  };

  return (
    <div className="space-y-6 w-full max-w-3xl">
      <form onSubmit={handleCreate} className="flex gap-2">
        <Input 
          placeholder={`New ${type.slice(0, -1)} name...`} 
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          disabled={createMutation.isPending}
          className="bg-surface flex-1 h-8 text-xs"
        />
        {hasSecondaryField && (
          <Input 
            placeholder={getSecondaryPlaceholder()} 
            value={newSecondary}
            onChange={(e) => setNewSecondary(e.target.value)}
            disabled={createMutation.isPending}
            className="bg-surface w-48 h-8 text-xs"
          />
        )}
        <Button type="submit" disabled={createMutation.isPending || !isFormValid} className="h-8 text-xs active:scale-[0.97] transition-transform duration-150 ease-out">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Add
        </Button>
      </form>

      <div className="border border-border rounded-lg overflow-x-auto no-scrollbar bg-surface shadow-sm">
        <table className="w-full min-w-[500px] text-sm text-left">
          <thead className="bg-slate-50/50 border-b border-border text-[10px] uppercase font-bold tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Name</th>
              {hasSecondaryField && <th className="px-3 py-2">{getSecondaryHeader()}</th>}
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {items.map((item) => (
                <motion.tr 
                  key={`${type}-${item.id}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 transition-colors duration-150"
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">{item.id}</td>
                  <td className="px-3 py-2 text-xs font-medium">{item.name}</td>
                  {hasSecondaryField && (
                    <td className="px-3 py-2 text-xs text-text-secondary">
                      {type === 'units' ? item.short_name : type === 'suppliers' ? item.contact : item.location}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 h-7 w-7 p-0 active:scale-[0.97] transition-transform duration-150 ease-out"
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {items.length === 0 && !isLoading && (
              <tr>
                <td colSpan={hasSecondaryField ? "4" : "3"} className="px-3 py-6 text-center text-xs text-text-secondary">
                  No {type} found.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={hasSecondaryField ? "4" : "3"} className="px-3 py-6 text-center text-xs text-text-secondary">
                  Loading...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SystemMetadata() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState('brands');

  if (user?.role !== 'admin') {
    return <div className="p-8 text-red-500">Access Denied. Admins only.</div>;
  }

  const tabs = [
    { id: 'brands', name: 'Brands', service: metadataService.getBrands, create: metadataService.createBrand, del: metadataService.deleteBrand },
    { id: 'categories', name: 'Categories', service: metadataService.getCategories, create: metadataService.createCategory, del: metadataService.deleteCategory },
    { id: 'units', name: 'Units', service: metadataService.getUnits, create: metadataService.createUnit, del: metadataService.deleteUnit },
    { id: 'suppliers', name: 'Suppliers', service: metadataService.getSuppliers, create: metadataService.createSupplier, del: metadataService.deleteSupplier },
    { id: 'warehouses', name: 'Warehouses', service: metadataService.getWarehouses, create: metadataService.createWarehouse, del: metadataService.deleteWarehouse },
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">System Metadata</h1>
          <p className="text-text-secondary text-xs mt-0.5">Manage global parameters and underlying data resources.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Card className="w-full md:w-48 shrink-0 h-fit shadow-sm bg-surface/90 backdrop-blur-md">
          <CardContent className="p-1.5 flex flex-row md:flex-col gap-0.5 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? 'secondary' : 'ghost'}
                className="justify-start whitespace-nowrap h-8 text-xs px-3 md:px-2 active:scale-[0.98] transition-transform duration-150 ease-out"
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.name}
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="flex-1 shadow-sm bg-surface/90 backdrop-blur-md">
          <CardHeader className="py-3 px-4 border-b border-border/50 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-semibold capitalize">{activeTab} Configuration</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex justify-center min-h-[300px]">
            {activeTabData && (
              <MetadataTable 
                type={activeTabData.id} 
                fetchFn={activeTabData.service}
                createFn={activeTabData.create}
                deleteFn={activeTabData.del}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
