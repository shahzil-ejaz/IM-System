import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, ScanLine, ShieldCheck, Box, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Scramble Text Effect ---
const CHARS = "!@#$%^&*():{};|,.<>/?";
const CYCLES_PER_LETTER = 2;
const SHUFFLE_TIME = 50;

function ScrambleText({ text, className }) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    let interval;
    let pos = 0;

    interval = setInterval(() => {
      pos++;
      const textArray = text.split("");
      const scrambledArray = textArray.map((char, index) => {
        if (pos / CYCLES_PER_LETTER > index) {
          return char;
        }
        const randomCharIndex = Math.floor(Math.random() * CHARS.length);
        const randomChar = CHARS[randomCharIndex];
        return randomChar;
      });

      setDisplayText(scrambledArray.join(""));

      if (pos >= text.length * CYCLES_PER_LETTER) {
        clearInterval(interval);
      }
    }, SHUFFLE_TIME);

    return () => clearInterval(interval);
  }, [text]);

  return <span className={className}>{displayText}</span>;
}

// --- Physics-based Interactive Widgets ---
function DraggableInventoryCard({ children, className, style }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      drag={!reduceMotion}
      dragConstraints={{ top: -50, left: -50, right: 50, bottom: 50 }}
      dragElastic={0.4}
      whileTap={{ scale: 0.95, cursor: "grabbing" }}
      whileDrag={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn(
        "cursor-grab absolute bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg rounded-xl p-4 flex flex-col gap-2 pointer-events-auto will-change-transform",
        className
      )}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// --- Main Landing View ---
export function LandingView() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const yOffset = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div className="min-h-[100dvh] w-full text-slate-950 font-sans selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden relative">

      {/* Navigation (Simple, single line) */}
      <header className="absolute top-0 left-0 right-0 h-20 px-6 md:px-12 flex items-center justify-between z-50 pointer-events-auto">

        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-emerald-600 font-black font-mono text-2xl tracking-tighter italic -rotate-3">IM</span>
          </div>
          <ScrambleText text="System" className="font-semibold tracking-tight text-lg" />
        </div>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-sm font-medium hover:text-emerald-700 transition-colors">
            Sign In
          </Link>
          <Link
            to="/login"
            className="text-sm font-bold bg-slate-950 text-white px-5 py-2.5 rounded-full hover:bg-slate-800 transition-colors active:scale-[0.98]"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main>
        {/* Asymmetric Hero Section */}
        <section className="relative min-h-[100dvh] flex flex-col md:flex-row items-center pt-24 pb-12 px-6 md:px-12 max-w-[1400px] mx-auto gap-12 lg:gap-24">

          {/* Left: Typography & CTAs */}
          <div className="flex-1 z-10 flex flex-col items-start pt-12 md:pt-0">
            <motion.h1
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] text-slate-950 max-w-[14ch]"
            >
              Inventory, perfectly balanced.
            </motion.h1>

            <motion.p
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="mt-6 text-lg md:text-xl text-slate-600 leading-relaxed max-w-[20ch]"
            >
              Precision tracking, lightning-fast POS, and beautiful real-time analytics.
            </motion.p>

            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="mt-10 flex items-center gap-4"
            >
              <Link
                to="/login"
                className="group flex items-center gap-2 bg-emerald-600 text-white font-bold px-7 py-4 rounded-full hover:bg-emerald-700 active:scale-[0.97] transition-all shadow-lg shadow-emerald-600/20 whitespace-nowrap"
              >
                Start managing
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Right: Physics/Interactive Visual */}
          <div className="flex-1 w-full h-[500px] relative hidden md:block pointer-events-none">
            <motion.div style={{ y: yOffset }} className="w-full h-full relative">

              {/* Decorative abstract elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/40 to-transparent rounded-full blur-3xl opacity-60 pointer-events-none" />

              {/* Draggable Cards */}
              <DraggableInventoryCard className="top-10 left-10 rotate-[-4deg] w-64 z-20">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                    <Box className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Espresso Beans</h4>
                    <p className="text-xs text-slate-500">SKU: ESP-001</p>
                  </div>
                </div>
                <div className="flex justify-between items-end mt-2">
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded">In Stock</span>
                  <span className="font-mono font-bold text-lg">240 kg</span>
                </div>
              </DraggableInventoryCard>

              <DraggableInventoryCard className="top-40 right-4 rotate-[6deg] w-56 z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Low Stock Alert</h4>
                    <p className="text-xs text-slate-500">Paper Cups</p>
                  </div>
                </div>
                <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-rose-500 w-[15%] h-full rounded-full" />
                </div>
              </DraggableInventoryCard>

              <DraggableInventoryCard className="bottom-20 left-24 rotate-[2deg] w-64 z-30">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Today's Sales</h4>
                    <p className="text-xs text-slate-500">Live updating</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">Rs. 4,290</span>
                  <span className="text-xs text-emerald-600 font-bold">+12%</span>
                </div>
              </DraggableInventoryCard>

              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] text-slate-400 font-medium tracking-widest uppercase pointer-events-none">
                ( Drag the cards )
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="py-24 px-6 md:px-12 max-w-[1400px] mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[320px]">

            {/* Cell 1: Large Feature */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-2 md:row-span-1 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200/80 rounded-3xl p-10 flex flex-col justify-between overflow-hidden relative group hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500"
            >
              <div className="relative z-10 max-w-md">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                  <ScanLine className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3">Lightning-fast POS</h3>
                <p className="text-slate-600 leading-relaxed">
                  Process orders seamlessly with barcode scanning, instant receipt generation, and real-time inventory deductions. Built for speed.
                </p>
              </div>
              {/* Decorative blurred blob */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl group-hover:bg-emerald-400/30 transition-colors duration-700" />
            </motion.div>

            {/* Cell 2: Tall Feature */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-1 md:row-span-2 bg-slate-950 text-white shadow-[0_8px_30px_rgb(0,0,0,0.15)] border border-slate-800 rounded-3xl p-10 flex flex-col justify-between overflow-hidden relative hover:shadow-[0_20px_40px_rgb(0,0,0,0.25)] hover:-translate-y-1 transition-all duration-500"
            >
              <div>
                <div className="w-12 h-12 bg-slate-800 text-slate-300 rounded-2xl flex items-center justify-center mb-6">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold tracking-tight mb-3">Total Visibility</h3>
                <p className="text-slate-400 leading-relaxed">
                  Never guess what's in stock. Track ledgers, handle procurement, and monitor your cashiers all from a single dashboard.
                </p>
              </div>
              <div className="mt-12 h-40 w-full border-t border-slate-800 pt-6">
                {/* Fake chart bars */}
                <div className="flex items-end justify-between h-full gap-2">
                  {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: "0%" }}
                      whileInView={{ height: `${h}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: 0.2 + (i * 0.1), type: "spring", bounce: 0 }}
                      className="w-full bg-emerald-500/80 rounded-t-sm"
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Cell 3: Standard Feature */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-1 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200/80 rounded-3xl p-8 flex flex-col hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500"
            >
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-2">Secure & Audited</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Role-based access control and a global audit log means you always know who did what, and when.
              </p>
            </motion.div>

            {/* Cell 4: Standard Feature */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="md:col-span-1 bg-emerald-50 shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-emerald-200/60 rounded-3xl p-8 flex flex-col justify-center items-center text-center group cursor-pointer hover:bg-emerald-100/50 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500"
            >
              <Link to="/login" className="flex flex-col items-center">
                <div className="w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <ArrowRight className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="font-bold text-slate-900">Sign in to workspace</h3>
              </Link>
            </motion.div>

          </div>
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-slate-200/50 mt-20 relative z-10 bg-slate-50/50">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="text-emerald-600 font-black font-mono text-xl tracking-tighter italic -rotate-3">IM</span>
            </div>
            <span className="font-semibold text-sm tracking-tight text-slate-900">System</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Precision.
          </p>
        </div>
      </footer>
    </div>
  );
}
