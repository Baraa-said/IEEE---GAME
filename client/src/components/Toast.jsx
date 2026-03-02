import React, { useEffect, useState } from 'react';

/**
 * ToastContainer – Renders a stack of animated toast notifications.
 */
export default function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const frameId = requestAnimationFrame(() => setVisible(true));
    // Auto dismiss
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onRemove(toast.id), 500);
    }, toast.duration || 4000);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, []);

  const typeStyles = {
    night: 'border-cyber-red/60 bg-gradient-to-r from-cyber-red/20 to-cyber-darker text-cyber-red',
    day: 'border-cyber-yellow/60 bg-gradient-to-r from-cyber-yellow/20 to-cyber-darker text-cyber-yellow',
    elimination: 'border-cyber-red/60 bg-gradient-to-r from-cyber-red/20 to-cyber-darker text-cyber-red',
    protection: 'border-cyber-green/60 bg-gradient-to-r from-cyber-green/20 to-cyber-darker text-cyber-green',
    info: 'border-cyber-blue/60 bg-gradient-to-r from-cyber-blue/20 to-cyber-darker text-cyber-blue',
    voting: 'border-cyber-blue/60 bg-gradient-to-r from-cyber-blue/20 to-cyber-darker text-cyber-blue',
  };

  const style = typeStyles[toast.type] || typeStyles.info;

  return (
    <div
      className={`
        pointer-events-auto border rounded-lg px-4 py-3 shadow-2xl backdrop-blur-md
        max-w-sm transition-all duration-500 ease-out
        ${style}
        ${visible && !exiting
          ? 'translate-x-0 opacity-100 scale-100'
          : exiting
            ? '-translate-y-2 opacity-0 scale-95'
            : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <p className="text-sm font-bold tracking-wide">{toast.title}</p>
      {toast.message && (
        <p className="text-xs mt-1 opacity-75 line-clamp-2">{toast.message}</p>
      )}
    </div>
  );
}
