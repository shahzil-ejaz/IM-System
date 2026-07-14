import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  Menu, Users, Settings, Database, 
  PackageSearch, Truck, LogOut, FileText 
} from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function ManagementLayout() {
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  const NAV_ITEMS = [
    { name: 'Stock Ledger', path: 'ledger', icon: <FileText className="w-5 h-5" />, roles: ['manager', 'admin'] },
    { name: 'Procurement', path: 'procurement', icon: <Truck className="w-5 h-5" />, roles: ['manager', 'admin'] },
    { name: 'Catalog & Batches', path: 'catalog', icon: <PackageSearch className="w-5 h-5" />, roles: ['manager', 'admin'] },
    { name: 'User Control', path: 'users', icon: <Users className="w-5 h-5" />, roles: ['admin'] },
    { name: 'System Settings', path: 'metadata', icon: <Settings className="w-5 h-5" />, roles: ['admin'] },
    { name: 'Global Audit', path: 'audit', icon: <Database className="w-5 h-5" />, roles: ['admin'] },
  ];

  const visibleNavItems = NAV_ITEMS.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      {/* Sidebar Layout */}
      <aside 
        className={cn(
          "bg-surface border-r border-border transition-all duration-300 flex flex-col shrink-0 shadow-sm",
          isCollapsed ? "w-16" : "w-64"
        )}
      >
        <div className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0">
          {!isCollapsed && <span className="font-semibold text-text-primary tracking-tight">Management Suite</span>}
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 text-text-secondary hover:text-text-primary"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 flex flex-col gap-1 px-2 no-scrollbar">
          {visibleNavItems.map(item => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link key={item.path} to={item.path}>
                <Button 
                  variant={isActive ? 'secondary' : 'ghost'} 
                  className={cn(
                    "w-full justify-start", 
                    isCollapsed ? "px-0 justify-center" : "px-3"
                  )}
                  title={item.name}
                >
                  {item.icon}
                  {!isCollapsed && <span className="ml-3 font-medium">{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border shrink-0">
          <div className={cn("flex items-center", isCollapsed ? "justify-center" : "justify-between")}>
            {!isCollapsed && (
              <div className="flex flex-col truncate pr-2">
                <span className="text-sm font-semibold text-text-primary capitalize">{user?.username}</span>
                <span className="text-xs text-text-secondary capitalize">{user?.role}</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={logout} className="text-red-500 hover:text-red-700 hover:bg-red-50">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto p-6 bg-canvas">
        <Outlet />
      </main>
    </div>
  );
}
