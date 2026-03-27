import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingCart, Plus, Minus, Trash2, CheckCircle, Package, Search, X } from 'lucide-react';

interface PosProps {
  products: Product[];
  onUpdateStock: (sku: string, change: number, type: 'sale' | 'receive' | 'adjustment') => Promise<boolean> | boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export function Pos({ products, onUpdateStock }: PosProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleCheckout = () => {
    cart.forEach(item => {
      onUpdateStock(item.product.sku, -item.quantity, 'sale');
    });
    setCart([]);
    setShowCart(false);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="p-4 h-full flex flex-col pb-24 relative">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Caisse / Ventes</h1>
        <p className="text-sm text-gray-500">Touchez un produit pour l'ajouter au panier</p>
      </header>

      {successMsg && (
        <div className="bg-green-50 text-green-800 border border-green-200 p-4 rounded-xl mb-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={20} className="text-green-600" />
          <p className="font-medium">Vente validée ! Les stocks ont été mis à jour.</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
          placeholder="Rechercher un produit..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={!product.isKit && product.stock <= 0}
              className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm flex flex-col items-center text-center hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-lg object-cover mb-2 border border-gray-100" />
              ) : (
                <div className="bg-gray-50 w-16 h-16 rounded-lg flex items-center justify-center mb-2 border border-gray-100">
                  <Package className="text-gray-400" size={24} />
                </div>
              )}
              <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight h-10">{product.name}</h3>
              <div className="mt-2 w-full flex justify-between items-center">
                <span className="text-sm font-bold text-blue-600">{product.price.toFixed(2)} €</span>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${product.isKit ? 'bg-blue-50 text-blue-700' : product.stock > 0 ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                  {product.isKit ? 'Kit' : product.stock > 0 ? `x${product.stock}` : 'Rupture'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating Cart Button */}
      {itemCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="absolute bottom-24 left-4 right-4 bg-gray-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-in slide-in-from-bottom-4 active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <ShoppingCart size={24} />
              <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {itemCount}
              </span>
            </div>
            <span className="font-medium">Voir le panier</span>
          </div>
          <span className="font-bold text-lg">{total.toFixed(2)} €</span>
        </button>
      )}

      {/* Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex flex-col justify-end">
          <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-full flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart size={24} />
                Panier ({itemCount})
              </h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-2">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-4 mb-6">
              {cart.map(item => (
                <div key={item.product.id} className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{item.product.name}</h3>
                    <p className="text-sm text-gray-500">{(item.product.price * item.quantity).toFixed(2)} €</p>
                  </div>
                  
                  <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                    <button 
                      onClick={() => item.quantity > 1 ? updateQuantity(item.product.id, -1) : removeFromCart(item.product.id)}
                      className="w-8 h-8 flex items-center justify-center rounded bg-white text-gray-600 shadow-sm"
                    >
                      {item.quantity > 1 ? <Minus size={16} /> : <Trash2 size={16} className="text-red-500" />}
                    </button>
                    <span className="w-4 text-center font-bold text-sm">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, 1)}
                      disabled={!item.product.isKit && item.quantity >= item.product.stock}
                      className="w-8 h-8 flex items-center justify-center rounded bg-white text-gray-600 shadow-sm disabled:opacity-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 mt-auto">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-500 font-medium">Total à encaisser</span>
                <span className="text-3xl font-bold text-gray-900">{total.toFixed(2)} €</span>
              </div>
              <button 
                onClick={handleCheckout}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl text-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
              >
                Valider la vente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
