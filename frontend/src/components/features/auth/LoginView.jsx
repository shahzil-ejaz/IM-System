import React, { useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="min-h-[100dvh] flex items-center justify-center bg-canvas p-4 selection:bg-primary selection:text-primary-foreground">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <Card className="shadow-[0_8px_40px_-12px_rgba(0,0,0,0.1)] border-border/40 bg-surface/95 backdrop-blur-xl">
          <CardHeader className="space-y-3 text-center pb-8 pt-8">
            <div className="mx-auto w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-inner mb-2">
              <span className="text-primary-foreground font-bold font-mono text-xl">IM</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-text-primary">
              Welcome back
            </CardTitle>
            <CardDescription className="text-text-secondary text-sm">
              Enter your credentials to securely access the workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider" htmlFor="username">
                  Username
                </label>
                <Input
                  id="username"
                  type="text"
                  placeholder="cashier_01"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  autoComplete="username"
                  className="h-11 transition-all focus:ring-primary focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider" htmlFor="password">
                  Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  autoComplete="current-password"
                  className="h-11 transition-all focus:ring-primary focus:border-primary"
                />
              </div>

              <AnimatePresence mode="wait">
                {loginError && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-md flex items-start gap-2 mt-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <p className="leading-tight">Invalid credentials or server unreachable.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <Button type="submit" className="w-full h-11 text-base group mt-2" disabled={isLoggingIn}>
                {isLoggingIn ? 'Authenticating...' : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
