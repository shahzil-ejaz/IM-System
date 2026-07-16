import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function LoginView() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoggingIn, loginError } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login({ username, password });
    } catch (err) {
      // Error is handled in the hook
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-white selection:bg-slate-900 selection:text-white">
      {/* Left Pane - Brand / Mood (Hidden on small screens) */}
      <div className="hidden md:flex md:w-1/2 lg:w-[55%] bg-zinc-950 relative overflow-hidden flex-col justify-between p-12 lg:p-24 text-zinc-400">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white text-zinc-950 flex items-center justify-center rounded-xl font-bold font-mono text-xl shadow-lg">
            IM
          </div>
          <span className="text-white font-medium tracking-wide">Inventory System</span>
        </div>
        
        <div className="relative z-10 space-y-6 max-w-lg">
          <h1 className="text-4xl lg:text-5xl text-white font-medium tracking-tight leading-[1.1]">
            Manage your inventory with absolute precision.
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-[45ch]">
            A premium, high-performance workspace designed for speed and reliability. Sign in to access your dashboard.
          </p>
        </div>

        {/* Decorative ambient gradients */}
        <div className="absolute top-0 right-0 -mr-32 -mt-32 w-[600px] h-[600px] rounded-full bg-emerald-500/20 blur-3xl mix-blend-screen pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-32 -mb-32 w-[400px] h-[400px] rounded-full bg-zinc-900/80 blur-3xl mix-blend-screen pointer-events-none" />
        
        <div className="relative z-10 text-sm font-mono tracking-wider uppercase opacity-50">
          SYSTEM // V2.0
        </div>
      </div>

      {/* Right Pane - Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 lg:p-24 bg-white relative">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Mobile Header (Only visible on small screens) */}
          <div className="md:hidden flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-zinc-950 text-white flex items-center justify-center rounded-xl font-bold font-mono text-xl shadow-lg">
              IM
            </div>
            <span className="text-zinc-950 font-medium tracking-wide">Inventory System</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950">
              Welcome back
            </h2>
            <p className="text-zinc-500 text-sm">
              Please enter your details to sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="e.g. cashier_01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  autoComplete="username"
                  className="h-12 bg-zinc-50/50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition-all rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider" htmlFor="password">
                    Password
                  </label>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  autoComplete="current-password"
                  className="h-12 bg-zinc-50/50 border-zinc-200 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-1 focus-visible:ring-emerald-500 focus-visible:border-emerald-500 transition-all rounded-xl"
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              {loginError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-2.5 mt-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p className="leading-relaxed">Invalid credentials or server unreachable. Please try again.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Button 
              type="submit" 
              className="w-full h-12 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all duration-200 ease-out group rounded-xl shadow-sm shadow-primary/20"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? 'Authenticating...' : (
                <span className="flex items-center justify-center">
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2 opacity-70 transition-transform duration-300 ease-out group-hover:translate-x-1" />
                </span>
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
