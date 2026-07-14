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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isAdmin = user?.role === 'admin';

  const NAV_ITEMS = [
    { name: 'Stock Ledger', path: 'ledger', icon: <FileText className="w-4 h-4" />, roles: ['manager', 'admin'] },
    { name: 'Procurement', path: 'procurement', icon: <Truck className="w-4 h-4" />, roles: ['manager', 'admin'] },
    { name: 'Catalog & Batches', path: 'catalog', icon: <PackageSearch className="w-4 h-4" />, roles: ['manager', 'admin'] },
    { name: 'User Control', path: 'users', icon: <Users className="w-4 h-4" />, roles: ['admin'] },
    { name: 'System Settings', path: 'metadata', icon: <Settings className="w-4 h-4" />, roles: ['admin'] },
    { name: 'Global Audit', path: 'audit', icon: <Database className="w-4 h-4" />, roles: ['admin'] },
  ];

  const visibleNavItems = NAV_ITEMS.filter(item => item.roles.includes(user?.role));

  return (
    <div className="flex h-[100dvh] bg-canvas overflow-hidden flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <header className="md:hidden h-12 bg-surface border-b border-border flex items-center justify-between px-4 shrink-0 shadow-sm z-40">
        <span className="font-semibold text-sm text-text-primary tracking-tight">Management Suite</span>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8 text-text-secondary active:scale-[0.97]"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </header>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Layout */}
      <aside 
        className={cn(
          "bg-surface border-r border-border transition-all duration-300 flex flex-col shrink-0 shadow-xl md:shadow-sm",
          "fixed md:relative inset-y-0 left-0 z-50 h-full",
          isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:translate-x-0",
          !isMobileMenuOpen && isCollapsed ? "md:w-14" : "md:w-56"
        )}
      >
        <div className="h-12 flex items-center justify-between px-3 border-b border-border shrink-0">
          {(!isCollapsed || isMobileMenuOpen) && <span className="font-semibold text-sm text-text-primary tracking-tight px-1">Management Suite</span>}
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 w-8 h-8 text-text-secondary hover:text-text-primary active:scale-[0.97] transition-transform duration-150 ease-out hidden md:flex"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu className="w-4 h-4" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-1 px-2 no-scrollbar">
          {visibleNavItems.map(item => {
            const isActive = location.pathname.includes(item.path);
            return (
              <Link key={item.path} to={item.path} onClick={() => setIsMobileMenuOpen(false)}>
                <Button 
                  variant={isActive ? 'secondary' : 'ghost'} 
                  className={cn(
                    "w-full justify-start h-9 text-xs active:scale-[0.98] transition-transform duration-150 ease-out", 
                    (!isMobileMenuOpen && isCollapsed) ? "px-0 justify-center" : "px-3"
                  )}
                  title={item.name}
                >
                  {item.icon}
                  {(!isCollapsed || isMobileMenuOpen) && <span className="ml-2 font-medium">{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border shrink-0">
          <div className={cn("flex items-center", (!isMobileMenuOpen && isCollapsed) ? "justify-center" : "justify-between")}>
            {(!isCollapsed || isMobileMenuOpen) && (
              <div className="flex flex-col truncate pr-2 pl-1">
                <span className="text-xs font-semibold text-text-primary capitalize">{user?.username}</span>
                <span className="text-[10px] text-text-secondary capitalize">{user?.role}</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={logout} className="w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 active:scale-[0.97] transition-transform duration-150 ease-out">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 overflow-y-auto p-3 md:p-4 bg-canvas relative w-full overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  );
}
