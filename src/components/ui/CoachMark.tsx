"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CoachMarkProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export default function CoachMark({ id, children, className = "" }: CoachMarkProps) {
  const storageKey = `vocafast-coach-${id}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      // Small delay so the page renders first
      const timer = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(storageKey, "1");
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.25 }}
          className={className}
        >
          <div className="relative bg-blue-500 rounded-2xl p-4 shadow-lg shadow-blue-500/20">
            <button
              onClick={dismiss}
              className="absolute top-3 right-3 w-6 h-6 rounded-full bg-blue-400/50 flex items-center justify-center"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-white">{children}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
