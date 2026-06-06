import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Modal thay thế window.confirm — không block browser, support dark mode.
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'info',
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6"
          >
            <div className="flex items-start gap-4 mb-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                variant === 'danger'
                  ? 'bg-red-100 dark:bg-red-900/40'
                  : 'bg-blue-100 dark:bg-blue-900/40'
              }`}>
                {variant === 'danger'
                  ? <AlertTriangle className="w-5 h-5 text-red-600" />
                  : <CheckCircle className="w-5 h-5 text-blue-600" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{title}</h3>
                <p className="text-sm text-slate-500 mt-1">{message}</p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition ${
                  variant === 'danger'
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-brand-600 hover:bg-brand-700'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
