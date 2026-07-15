import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, UserMinus, UserCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../services/userService';
import { motion, AnimatePresence } from 'motion/react';
import { usePopup } from '../../../contexts/PopupContext';

export function UserControlCenter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showPopup } = usePopup();
  
  // Fetch real users from backend
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: user?.role === 'admin'
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => userService.toggleUserStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showPopup({ title: 'Success', message: 'User status updated.', type: 'success' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showPopup({ title: 'Success', message: 'User deleted successfully.', type: 'success' });
    }
  });
  
  if (user?.role !== 'admin') {
    return <div className="p-8 text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold text-text-primary tracking-tight">User Control Center</h1>
          <p className="text-text-secondary text-xs mt-0.5">Manage platform access, roles, and employee records.</p>
        </div>
        <Button className="h-8 text-xs px-3 active:scale-[0.97] transition-transform duration-150 ease-out">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Register User
        </Button>
      </div>

      <Card className="border-border shadow-sm bg-surface/90 backdrop-blur-md">
        <CardHeader className="py-3 px-4 border-b border-border/50 bg-slate-50/50">
          <CardTitle className="text-xs font-semibold text-text-secondary">Registered Employees</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[600px] text-sm text-left">
            <thead className="bg-slate-50/50 border-b border-border text-[10px] uppercase font-bold tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2 w-20">ID</th>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">System Scope</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-xs text-text-secondary">Loading users...</td>
                </tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-3 py-6 text-center text-xs text-text-secondary">No users found.</td>
                </tr>
              )}
              <AnimatePresence>
                {users.map((u) => (
                  <motion.tr 
                    key={u.id}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="border-b border-border/50 last:border-0 hover:bg-slate-50/50 transition-colors duration-150"
                  >
                    <td className="px-3 py-2 font-mono text-[11px] text-text-secondary">#{u.id}</td>
                    <td className="px-3 py-2 font-medium text-xs">{u.username}</td>
                    <td className="px-3 py-2">
                      <span className="capitalize px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-sm font-bold">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {u.is_active ? (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-600 uppercase tracking-wide">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-600 uppercase tracking-wide">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" /> Suspended
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7 active:scale-[0.97] transition-transform duration-150 ease-out"
                          onClick={() => toggleMutation.mutate(u.id)}
                          disabled={toggleMutation.isPending}
                        >
                          {u.is_active ? <UserMinus className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 active:scale-[0.97] transition-transform duration-150 ease-out"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this user?")) {
                              deleteMutation.mutate(u.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
