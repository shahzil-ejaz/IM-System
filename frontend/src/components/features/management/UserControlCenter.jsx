import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, UserMinus, UserCheck, Trash2 } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../services/userService';

export function UserControlCenter() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch real users from backend
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.getUsers(),
    enabled: user?.role === 'admin'
  });

  const toggleMutation = useMutation({
    mutationFn: (id) => userService.toggleUserStatus(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] })
  });
  
  if (user?.role !== 'admin') {
    return <div className="p-8 text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">User Control Center</h1>
          <p className="text-text-secondary text-sm mt-1">Manage platform access, roles, and employee records.</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Register User
        </Button>
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader className="py-4 border-b border-border bg-slate-50/50">
          <CardTitle className="text-sm font-medium text-text-secondary">Registered Employees</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>System Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-text-secondary">Loading users...</TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-text-secondary">No users found.</TableCell>
                </TableRow>
              ) : users.map((u) => (
                <TableRow key={u.id} className="transition-colors hover:bg-slate-50">
                  <TableCell className="font-mono text-text-secondary">{u.id}</TableCell>
                  <TableCell className="font-medium">{u.username}</TableCell>
                  <TableCell>
                    <span className="capitalize px-2 py-1 bg-slate-100 text-slate-700 text-xs rounded-md font-semibold">
                      {u.role}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.is_active ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
                        <div className="w-2 h-2 rounded-full bg-green-500" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-semibold text-red-600">
                        <div className="w-2 h-2 rounded-full bg-red-500" /> Suspended
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8"
                        onClick={() => toggleMutation.mutate(u.id)}
                        disabled={toggleMutation.isPending}
                      >
                        {u.is_active ? <UserMinus className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to delete this user?")) {
                            deleteMutation.mutate(u.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
