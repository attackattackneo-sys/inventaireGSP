import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { Camera, Search, CheckCircle, AlertCircle, X, Package } from 'lucide-react';

interface ScannerProps {
  products: Product[];
  onUpdateStock: (sku: string, change: number, type: 'sale' | 'receive' | 'adjustment') => boolean;
}

export function Scanner({ products, onUpdateStock }: ScannerProps) {
  const [skuInput, setSkuInput] = useState('');
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input for hardware scanners
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuInput.trim()) return;

    const product = products.find(p => p.sku.toUpperCase() === skuInput.trim().toUpperCase());
    
    if (product) {
      setLastScanned(product);
      setMessage(null);
    } else {
      setLastScanned(null);
      setMessage({ text: `SKU inconnu: ${skuInput}`, type: 'error' });
    }
    
    setSkuInput('');
    inputRef.current?.focus();
  };

  const handleAction = (change: number, type: 'sale' | 'receive') => {
    if (!lastScanned) return;

    // For kits, we just show a success message in this MVP
    // In a full app, we'd decrement the components
    const success = onUpdateStock(lastScanned.sku, change, type);
    
    if (success) {
      setMessage({ 
        text: `${change > 0 ? 'Réception' : 'Vente'} enregistrée : ${lastScanned.name}`, 
        type: 'success' 
      });
      // Update local state to reflect new stock immediately
      setLastScanned(prev => prev ? { ...prev, stock: Math.max(0, prev.stock + change) } : null);
    }
    
    inputRef.current?.focus();
  };

  return (
    <div className="p-4 h-full flex flex-col pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mode Scan</h1>
        <p className="text-sm text-gray-500">Scannez ou saisissez un SKU</p>
      </header>

      {/* Simulated Camera View / Input Area */}
      <div className="bg-gray-900 rounded-2xl aspect-video mb-6 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
        <Camera className="text-gray-600 mb-2 opacity-50" size={48} />
        <p className="text-gray-400 text-sm font-medium">Caméra prête (Simulation)</p>
        
        {/* Scanning line animation */}
        <div className="absolute top-0 left-0 w-full h-1 bg-red-500 opacity-70 animate-[scan_2s_ease-in-out_infinite]" 
             style={{ boxShadow: '0 0 8px 2px rgba(239, 68, 68, 0.5)' }}></div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
      `}</style>

      {/* Manual Input Form (Works with Bluetooth Scanners) */}
      <form onSubmit={handleScan} className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            className="block w-full pl-10 pr-3 py-4 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-lg shadow-sm"
            placeholder="SKU (ex: CAD-NO-2030)"
            value={skuInput}
            onChange={(e) => setSkuInput(e.target.value)}
            autoComplete="off"
          />
          <button 
            type="submit"
            className="absolute inset-y-2 right-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 rounded-lg text-sm font-medium transition-colors"
          >
            Chercher
          </button>
        </div>
      </form>

      {/* Feedback Message */}
      {message && (
        <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="shrink-0 mt-0.5" size={18} /> : <AlertCircle className="shrink-0 mt-0.5" size={18} />}
          <p className="text-sm font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto opacity-50 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Action Area for Scanned Product */}
      <div className="flex-1">
        {lastScanned ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dernier scan</span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">{lastScanned.name}</h2>
              <p className="text-sm text-gray-500 font-mono mt-1">{lastScanned.sku}</p>
            </div>
            
            <div className="flex justify-between items-center mb-6 bg-gray-50 p-4 rounded-xl">
              <span className="text-gray-600 font-medium">Stock actuel</span>
              <span className={`text-2xl font-bold ${lastScanned.stock <= lastScanned.alertThreshold && !lastScanned.isKit ? 'text-red-600' : 'text-gray-900'}`}>
                {lastScanned.isKit ? '∞' : lastScanned.stock}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAction(-1, 'sale')}
                className="bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl font-bold text-lg shadow-sm transition-colors flex flex-col items-center justify-center gap-1 active:scale-95"
              >
                <span>VENDRE</span>
                <span className="text-orange-200 text-sm font-normal">(-1)</span>
              </button>
              <button
                onClick={() => handleAction(1, 'receive')}
                className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-sm transition-colors flex flex-col items-center justify-center gap-1 active:scale-95"
              >
                <span>RECEVOIR</span>
                <span className="text-blue-200 text-sm font-normal">(+1)</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
            <Package size={48} className="mb-4 opacity-20" />
            <p>Scannez un article pour afficher les actions rapides.</p>
          </div>
        )}
      </div>
    </div>
  );
}
