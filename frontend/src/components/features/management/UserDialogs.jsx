import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../services/userService';
import { usePopup } from '../../../contexts/PopupContext';

// =====================================
// Register User Dialog
// =====================================
export function RegisterUserDialog() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('cashier');

  const queryClient = useQueryClient();
  const { showPopup } = usePopup();

  const registerMutation = useMutation({
    mutationFn: (userData) => userService.registerUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showPopup({ title: 'Success', message: 'User registered successfully!', type: 'success' });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      showPopup({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to register user',
        type: 'error'
      });
    }
  });

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setRole('cashier');
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password || !role) return;
    registerMutation.mutate({ username, password, role, is_active: true });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="h-8 text-xs px-3 active:scale-[0.97] transition-transform duration-150 ease-out">
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          Register User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register New Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium leading-none">Username</label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. john_doe"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium leading-none">Role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cashier">Cashier</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="self_order">Self-Order</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={registerMutation.isPending || !username || !password}
            >
              {registerMutation.isPending ? 'Registering...' : 'Register User'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// =====================================
// Delete User Dialog
// =====================================
export function DeleteUserDialog({ user, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const { showPopup } = usePopup();

  const deleteMutation = useMutation({
    mutationFn: (id) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      showPopup({ title: 'Success', message: 'User deleted successfully.', type: 'success' });
      onOpenChange(false);
    },
    onError: (error) => {
      showPopup({
        title: 'Error',
        message: error.response?.data?.detail || 'Failed to delete user.',
        type: 'error'
      });
      onOpenChange(false);
    }
  });

  const handleDelete = () => {
    if (user) {
      deleteMutation.mutate(user.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete User</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the user <span className="font-bold text-slate-800">{user?.username}</span>? This action cannot be undone. If they have associated records, the system might reject this deletion; in that case, please suspend them instead.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
