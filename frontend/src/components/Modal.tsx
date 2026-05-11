import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xl animate-in fade-in duration-700">
      <div 
        className="bg-white rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] w-full max-w-3xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-700 border border-emerald-100/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-10 py-8 border-b border-emerald-50/50 flex items-center justify-between bg-emerald-50/10">
          <div className="space-y-1">
             <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase italic">{title}</h3>
             <div className="h-1 w-8 bg-emerald-500 rounded-full"></div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-rose-50 hover:text-rose-600 rounded-2xl text-slate-300 transition-all duration-500 group"
          >
            <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
          </button>
        </div>
        <div className="p-10 max-h-[85vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
      <div className="fixed inset-0 -z-10 cursor-pointer" onClick={onClose}></div>
    </div>
  );
};

export default Modal;
