/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChefHat, Utensils, Sparkles, Flame, Clock, Compass } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface LoadingScreenProps {
  message?: string;
  duration?: number; // duration in ms
  onComplete?: () => void;
  fullScreen?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  duration = 2000,
  onComplete,
  fullScreen = true
}) => {
  const [progress, setProgress] = useState(0);
  const [currentText, setCurrentText] = useState('Connecting to local home kitchens...');

  const loadingPhrases = [
    'Connecting to local home kitchens...',
    'Sourcing freshly prepared regional ingredients...',
    'Assembling master chef networks...',
    'Calibrating warm container insulated carriers...',
    'Structuring nutritious subscription routines...',
    'Securing premium dining portals...',
    'Welcome to TiffinGo!'
  ];

  useEffect(() => {
    // Progress interval
    const intervalTime = duration / 100;
    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 1;
      });
    }, intervalTime);

    // Phrase rotation timer
    const phraseInterval = duration / 4;
    let phraseIndex = 0;
    const phraseTimer = setInterval(() => {
      phraseIndex += 1;
      if (phraseIndex < loadingPhrases.length) {
        setCurrentText(loadingPhrases[phraseIndex]);
      }
    }, phraseInterval);

    // Completion timeout
    const completionTimer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => {
      clearInterval(progressTimer);
      clearInterval(phraseTimer);
      clearTimeout(completionTimer);
    };
  }, [duration, onComplete]);

  // Display custom message if provided
  const displayText = message || currentText;

  // Steam animation variants for custom premium touch
  const steamVariants = (delay: number) => ({
    animate: {
      y: [0, -35],
      x: [0, delay % 2 === 0 ? 8 : -8, delay % 2 === 0 ? -4 : 4],
      opacity: [0, 0.8, 0],
      scale: [0.8, 1.1, 0.7],
      transition: {
        duration: 1.8,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }
    }
  });

  return (
    <div
      id="tiffingo-loading-container"
      className={`flex flex-col items-center justify-center bg-slate-950 font-sans select-none overflow-hidden ${
        fullScreen ? 'fixed inset-0 z-50 w-screen h-screen' : 'relative py-12 px-6 w-full'
      }`}
    >
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-600/15 blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-teal-500/15 blur-[120px] animate-pulse"></div>
        <div className="absolute top-[40%] left-[30%] w-[20%] h-[20%] rounded-full bg-emerald-500/5 blur-[100px]"></div>
      </div>

      <div id="loading-card" className="relative flex flex-col items-center max-w-md w-full px-8 text-center z-10">
        
        {/* Steam Effects Above the Tiffin */}
        <div className="relative h-12 w-24 flex justify-around items-end overflow-visible mb-1">
          <motion.div
            variants={steamVariants(0)}
            animate="animate"
            className="w-1.5 h-6 bg-emerald-400/40 rounded-full blur-[1px]"
          />
          <motion.div
            variants={steamVariants(0.5)}
            animate="animate"
            className="w-1.5 h-8 bg-teal-400/30 rounded-full blur-[1px]"
          />
          <motion.div
            variants={steamVariants(1)}
            animate="animate"
            className="w-1.5 h-5 bg-emerald-300/40 rounded-full blur-[1px]"
          />
        </div>

        {/* Dynamic Stylized App Logo Brand Icon */}
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500/40 to-teal-500/20 blur-2xl scale-125"
          />
          
          <motion.div
            animate={{ 
              y: [0, -6, 0],
              scale: [1, 1.04, 1]
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="relative flex items-center justify-center p-2 rounded-[28%] bg-slate-900 border-2 border-emerald-500/30 shadow-2xl shadow-emerald-950/40"
          >
            <AppLogo size={96} glow={true} className="!shadow-none" />
            
            {/* Glowing active indicator */}
            <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping"></div>
            <div className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
          </motion.div>
        </div>

        {/* Title */}
        <h2 id="loading-brand-title" className="text-2xl font-black text-white tracking-wider flex items-center justify-center gap-1.5 mb-2">
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">TiffinGo</span>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-widest font-mono">Pro</span>
        </h2>
        
        {/* Animated Slogan */}
        <p className="text-xs text-slate-400 font-semibold tracking-wide h-6 flex items-center justify-center gap-1">
          <Sparkles size={11} className="text-emerald-400 animate-spin" />
          Nutritious Home Dining System
        </p>

        {/* Dynamic Status Text */}
        <div className="w-full mt-12 mb-5 h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p
              key={displayText}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="text-xs font-semibold text-slate-300 tracking-wide font-mono"
            >
              {displayText}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress Bar Container */}
        <div className="w-full bg-slate-900 border border-slate-800/80 h-3 rounded-full overflow-hidden p-0.5 relative">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-400 shadow-[0_0_12px_rgba(16,185,129,0.6)]"
          />
        </div>

        {/* Percentage Counter */}
        <span className="text-[10px] font-black font-mono text-emerald-400/80 mt-2 block tracking-wider">
          SYSTEM DISPATCH IN PROGRESS: {progress}%
        </span>

        {/* Feature Icons Footer */}
        <div className="flex items-center justify-center gap-6 mt-16 text-slate-600">
          <div className="flex flex-col items-center gap-1">
            <Flame size={14} className="hover:text-emerald-500 transition-colors" />
            <span className="text-[8px] uppercase tracking-widest font-black font-mono text-slate-600/70">Hot Box</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          <div className="flex flex-col items-center gap-1">
            <Compass size={14} className="hover:text-emerald-500 transition-colors" />
            <span className="text-[8px] uppercase tracking-widest font-black font-mono text-slate-600/70">GPS Route</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
          <div className="flex flex-col items-center gap-1">
            <Clock size={14} className="hover:text-emerald-500 transition-colors" />
            <span className="text-[8px] uppercase tracking-widest font-black font-mono text-slate-600/70">Ontime Delivery</span>
          </div>
        </div>

      </div>
    </div>
  );
};
