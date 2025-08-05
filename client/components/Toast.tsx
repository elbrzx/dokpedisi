import React, { useEffect, useState } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 3000, 
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 transition-all duration-300 transform ${
      isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
    }`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center gap-3">
        <div className={`flex-shrink-0 ${
          type === 'success' ? 'text-green-600' : 'text-red-600'
        }`}>
          <CheckCircle className="h-5 w-5" />
        </div>
        <p className="text-sm text-gray-800 flex-1">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
