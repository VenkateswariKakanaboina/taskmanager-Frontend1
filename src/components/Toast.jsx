import React from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';

const icons = {
  success: <CheckCircle size={16} color="var(--green)" />,
  error: <XCircle size={16} color="var(--red)" />,
  info: <Info size={16} color="var(--accent)" />,
};

export const ToastContainer = ({ toasts }) => (
  <div className="toast-container">
    {toasts.map((t) => (
      <div key={t.id} className={`toast ${t.type}`}>
        {icons[t.type]}
        <span>{t.message}</span>
      </div>
    ))}
  </div>
);
