import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '../../../hooks/useAuth';
import { metadataService } from '../../../services/metadataService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { usePopup } from '../../../contexts/PopupContext';

function MetadataTable({ type, fetchFn, createFn, updateFn, deleteFn }) {
  const queryClient = useQueryClient();
  const { showPopup } = usePopup();
  const [newValue, setNewValue] = useState('');
  const [newSecondary, setNewSecondary] = useState('');
  const [newTertiary, setNewTertiary] = useState('');
  const [editingId, setEditingId] = useState(null);
  
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['metadata', type],
    queryFn: fetchFn
  });

  const safeItems = Array.isArray(items) ? items : [];

  const createMutation = useMutation({
    mutationFn: createFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata', type] });
      setNewValue('');
      setNewSecondary('');
      setNewTertiary('');
      showPopup({ type: 'success', message: 'Item added successfully.', title: 'Success' });
    },
    onError: (error) => {
      showPopup({
        type: 'error',
        title: 'Error',
        message: error?.response?.data?.detail || 'Unable to add this item right now.'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => updateFn(editingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata', type] });
      setNewValue('');
      setNewSecondary('');
      setNewTertiary('');
      setEditingId(null);
      showPopup({ type: 'success', message: 'Item updated successfully.', title: 'Success' });
    },
    onError: (error) => {
      showPopup({
        type: 'error',
        title: 'Error',
        message: error?.response?.data?.detail || 'Unable to update this item right now.'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metadata', type] });
      showPopup({ type: 'success', message: 'Item removed successfully.', title: 'Success' });
    },
    onError: (error) => {
      showPopup({
        type: 'error',
        title: 'Error',
        message: error?.response?.data?.detail || 'Unable to remove this item right now.'
      });
    }
  });

  const handleCreateOrUpdate = (e) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    
    let payload = {};
    if (type === 'units') {
      if (!newSecondary.trim()) return;
      payload = { name: newValue.trim(), short_name: newSecondary.trim() };
    } else if (type === 'suppliers') {
      payload = { name: newValue.trim(), contact: newSecondary.trim(), whatsapp_number: newTertiary.trim() || null };
    } else if (type === 'warehouses') {
      payload = { name: newValue.trim(), location: newSecondary.trim() };
    } else {
      payload = { name: newValue.trim() };
    }

    if (editingId && updateFn) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item.id);
    setNewValue(item.name);
    setNewSecondary(type === 'units' ? item.short_name : type === 'suppliers' ? (item.contact || '') : (item.location || ''));
    setNewTertiary(type === 'suppliers' ? (item.whatsapp_number || '') : '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewValue('');
    setNewSecondary('');
    setNewTertiary('');
  };

  const hasSecondaryField = ['units', 'suppliers', 'warehouses'].includes(type);
  const hasTertiaryField = type === 'suppliers';
  const isFormValid = hasSecondaryField ? newValue.trim() && (type === 'units' ? newSecondary.trim() : true) : newValue.trim();
  const isPending = createMutation.isPending || (updateMutation && updateMutation.isPending);

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

  const getTertiaryHeader = () => {
    if (type === 'suppliers') return "WhatsApp";
    return "";
  };

  return (
    <div className="space-y-6 w-full max-w-4xl">
      <form onSubmit={handleCreateOrUpdate} className="flex gap-2">
        <Input 
          placeholder={editingId ? `Update ${type.slice(0, -1)} name...` : `New ${type.slice(0, -1)} name...`} 
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          disabled={isPending}
          className="bg-surface flex-1 h-8 text-xs"
        />
        {hasSecondaryField && (
          <Input 
            placeholder={getSecondaryPlaceholder()} 
            value={newSecondary}
            onChange={(e) => setNewSecondary(e.target.value)}
            disabled={isPending}
            className="bg-surface w-40 h-8 text-xs"
          />
        )}
        {hasTertiaryField && (
          <Input 
            placeholder="WhatsApp (e.g. +123456)..." 
            value={newTertiary}
            onChange={(e) => setNewTertiary(e.target.value)}
            disabled={isPending}
            className="bg-surface w-40 h-8 text-xs"
          />
        )}
        <Button type="submit" disabled={isPending || !isFormValid} className="h-8 text-xs active:scale-[0.97] transition-transform duration-150 ease-out">
          {editingId ? 'Update' : <><Plus className="w-3.5 h-3.5 mr-1" /> Add</>}
        </Button>
        {editingId && (
          <Button type="button" variant="outline" onClick={cancelEdit} disabled={isPending} className="h-8 text-xs">
            Cancel
          </Button>
        )}
      </form>



      <div className="border border-border rounded-lg overflow-x-auto no-scrollbar bg-surface shadow-sm">
        <table className="w-full min-w-125 text-sm text-left">
          <thead className="bg-secondary/50 border-b border-border text-[10px] uppercase font-bold tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Name</th>
              {hasSecondaryField && <th className="px-3 py-2">{getSecondaryHeader()}</th>}
              {hasTertiaryField && <th className="px-3 py-2">{getTertiaryHeader()}</th>}
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="wait">
              {safeItems.map((item) => (
                <motion.tr 
                  key={`${type}-${item.id}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="border-b border-border/50 last:border-0 hover:bg-secondary/50 transition-colors duration-150"
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">{item.id}</td>
                  <td className="px-3 py-2 text-xs font-medium">{item.name}</td>
                  {hasSecondaryField && (
                    <td className="px-3 py-2 text-xs text-text-secondary">
                      {type === 'units' ? item.short_name : type === 'suppliers' ? item.contact : item.location}
                    </td>
                  )}
                  {hasTertiaryField && (
                    <td className="px-3 py-2 text-xs text-text-secondary">
                      {item.whatsapp_number}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right">
                    {updateFn && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 h-7 px-2 mr-1 active:scale-[0.97] transition-transform duration-150 ease-out"
                        onClick={() => handleEditClick(item)}
                        disabled={isPending}
                      >
                        Edit
                      </Button>
                    )}
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
            {safeItems.length === 0 && !isLoading && (
              <tr>
                <td colSpan={1 + 1 + (hasSecondaryField ? 1 : 0) + (hasTertiaryField ? 1 : 0) + 1} className="px-3 py-6 text-center text-xs text-text-secondary">
                  No {type} found.
                </td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={1 + 1 + (hasSecondaryField ? 1 : 0) + (hasTertiaryField ? 1 : 0) + 1} className="px-3 py-6 text-center text-xs text-text-secondary">
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
    { id: 'suppliers', name: 'Suppliers', service: metadataService.getSuppliers, create: metadataService.createSupplier, update: metadataService.updateSupplier, del: metadataService.deleteSupplier },
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
          <CardContent className="p-4 flex justify-center min-h-75">
            {activeTabData && (
              <MetadataTable 
                type={activeTabData.id} 
                fetchFn={activeTabData.service}
                createFn={activeTabData.create}
                updateFn={activeTabData.update}
                deleteFn={activeTabData.del}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
