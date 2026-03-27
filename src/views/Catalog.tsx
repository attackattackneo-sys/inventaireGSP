import React, { useState } from 'react';
import { Product } from '../types';
import { Search, Plus, Package, Filter, Minus, X, Printer, QrCode, Trash2, ImagePlus, Edit2, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface CatalogProps {
  products: Product[];
  onNavigate: (view: string) => void;
  onUpdateStock: (sku: string, change: number, type: 'sale' | 'receive' | 'adjustment') => Promise<boolean> | boolean;
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export function Catalog({ products, onNavigate, onUpdateStock, onAddProduct, onUpdateProduct, onDeleteProduct }: CatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  
  // Modals state
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showLabelFor, setShowLabelFor] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form state
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '', sku: '', category: 'Accessoires', price: 0, stock: 0, location: 'Réserve', alertThreshold: 5, isKit: false, imageUrl: ''
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory ? p.category === filterCategory : true;
    return matchesSearch && matchesCategory;
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setNewProduct({ ...newProduct, imageUrl: dataUrl });
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddOrUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.sku) return;

    const productToSave: Product = {
      id: isEditing && newProduct.id ? newProduct.id : Date.now().toString(),
      name: newProduct.name!,
      sku: newProduct.sku.toUpperCase(),
      category: newProduct.category || 'Autre',
      price: Number(newProduct.price) || 0,
      stock: Number(newProduct.stock) || 0,
      location: newProduct.location || 'Magasin',
      alertThreshold: Number(newProduct.alertThreshold) || 0,
      isKit: newProduct.isKit || false,
      imageUrl: newProduct.imageUrl,
    };

    if (isEditing) {
      onUpdateProduct(productToSave);
      showToast("Produit modifié avec succès.");
    } else {
      onAddProduct(productToSave);
      setShowLabelFor(productToSave); // Show label immediately after creation
    }
    
    setIsAddingProduct(false);
    setIsEditing(false);
    
    // Reset form
    setNewProduct({
      name: '', sku: '', category: 'Accessoires', price: 0, stock: 0, location: 'Réserve', alertThreshold: 5, isKit: false, imageUrl: ''
    });
  };

  const generateSKU = () => {
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PRD-${randomPart}`;
  };

  const openEditModal = (product: Product) => {
    setNewProduct(product);
    setIsEditing(true);
    setIsAddingProduct(true);
  };

  const openAddModal = () => {
    setNewProduct({
      name: '', sku: generateSKU(), category: 'Accessoires', price: 0, stock: 0, location: 'Réserve', alertThreshold: 5, isKit: false, imageUrl: ''
    });
    setIsEditing(false);
    setIsAddingProduct(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      onDeleteProduct(productToDelete.id);
      setProductToDelete(null);
      showToast("Produit supprimé avec succès.");
    }
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="p-4 h-full flex flex-col pb-24 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle size={20} className="text-green-400" />
          <p className="font-medium text-sm">{toastMsg}</p>
        </div>
      )}

      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalogue</h1>
          <p className="text-sm text-gray-500">{products.length} références</p>
        </div>
        <button 
          className="bg-gray-900 hover:bg-gray-800 text-white p-2 rounded-lg shadow-sm transition-colors"
          onClick={openAddModal}
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Search and Filter */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm"
            placeholder="Rechercher un produit ou SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilterCategory(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filterCategory === null ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tous
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filterCategory === cat ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-4">
        {filteredProducts.length > 0 ? (
          filteredProducts.map(product => (
            <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col gap-3 hover:border-blue-300 transition-colors relative group">
              
              {/* Action Buttons (Top Right) */}
              <div className="absolute top-2 right-2 flex gap-1">
                <button 
                  onClick={() => openEditModal(product)}
                  className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Modifier ce produit"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => setProductToDelete(product)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  title="Supprimer ce produit"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="flex items-start gap-4 pr-16">
                {/* Product Image or Placeholder */}
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-lg object-cover shrink-0 border border-gray-100" />
                ) : (
                  <div className="bg-gray-50 w-16 h-16 rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
                    <Package className="text-gray-400" size={24} />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-semibold truncate leading-tight">{product.name}</h3>
                  <p className="text-gray-500 text-xs font-mono mt-1">{product.sku}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded uppercase tracking-wider">
                      {product.location}
                    </span>
                    <span className="text-xs font-medium text-gray-900">
                      {product.price.toFixed(2)} €
                    </span>
                  </div>
                </div>
              </div>

              {/* Inline Stock Controls & QR */}
              <div className="flex items-center justify-between mt-1 pt-3 border-t border-gray-100">
                <button 
                  onClick={() => setShowLabelFor(product)}
                  className="text-gray-500 hover:text-blue-600 p-2 bg-gray-50 rounded-lg transition-colors flex items-center gap-2 text-xs font-medium"
                  title="Générer étiquette QR"
                >
                  <QrCode size={16} />
                  <span>Étiquette</span>
                </button>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => onUpdateStock(product.sku, -1, 'sale')}
                    disabled={product.isKit || product.stock <= 0}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Minus size={16} />
                  </button>
                  
                  <span className={`text-lg font-bold w-8 text-center ${
                    product.isKit ? 'text-blue-600' : 
                    product.stock <= product.alertThreshold ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {product.isKit ? '∞' : product.stock}
                  </span>

                  <button 
                    onClick={() => onUpdateStock(product.sku, 1, 'receive')}
                    disabled={product.isKit}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Filter className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p className="text-lg font-medium text-gray-900">Aucun produit trouvé</p>
            <p className="text-sm">Modifiez vos filtres ou votre recherche.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <Trash2 size={24} />
              <h2 className="text-xl font-bold text-gray-900">Supprimer le produit ?</h2>
            </div>
            <p className="text-gray-500 mb-6">
              Êtes-vous sûr de vouloir supprimer <strong>"{productToDelete.name}"</strong> ? Cette action est irréversible et supprimera le produit de votre catalogue.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setProductToDelete(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {isAddingProduct && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 my-auto">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-900">
                {isEditing ? 'Modifier le Produit' : 'Nouveau Produit'}
              </h2>
              <button onClick={() => setIsAddingProduct(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddOrUpdateProduct} className="space-y-4">
              {/* Image Upload */}
              <div className="flex justify-center mb-4">
                <label className="relative cursor-pointer group">
                  <div className={`w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center overflow-hidden transition-colors ${newProduct.imageUrl ? 'border-blue-500' : 'border-gray-300 hover:border-blue-400 bg-gray-50'}`}>
                    {newProduct.imageUrl ? (
                      <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <ImagePlus className="text-gray-400 mb-1" size={24} />
                        <span className="text-[10px] text-gray-500 font-medium text-center leading-tight px-1">Ajouter ou modifier photo</span>
                      </>
                    )}
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nom du produit *</label>
                <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} placeholder="Ex: Cadre Bois 20x30" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">SKU (Code) *</label>
                  <input required type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} placeholder="CAD-BOIS-2030" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Catégorie</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} placeholder="Cadres" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Type de produit</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={newProduct.isKit ? 'kit' : 'standard'}
                    onChange={e => setNewProduct({...newProduct, isKit: e.target.value === 'kit'})}
                  >
                    <option value="standard">Produit Standard</option>
                    <option value="kit">Kit / Service (Infini)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prix TTC (€)</label>
                  <input type="number" step="0.01" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                    value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: parseFloat(e.target.value)})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Stock Initial</label>
                  <input 
                    type="number" 
                    disabled={newProduct.isKit}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400" 
                    value={newProduct.isKit ? 0 : newProduct.stock} 
                    onChange={e => setNewProduct({...newProduct, stock: parseInt(e.target.value)})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Alerte Stock Bas</label>
                  <input 
                    type="number" 
                    disabled={newProduct.isKit}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400" 
                    value={newProduct.isKit ? 0 : newProduct.alertThreshold} 
                    onChange={e => setNewProduct({...newProduct, alertThreshold: parseInt(e.target.value)})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Emplacement</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={newProduct.location} onChange={e => setNewProduct({...newProduct, location: e.target.value})} />
              </div>

              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl mt-2 hover:bg-blue-700 transition-colors">
                {isEditing ? 'Enregistrer les modifications' : "Créer et générer l'étiquette"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Label Modal */}
      {showLabelFor && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-900">Étiquette Produit</h2>
              <button onClick={() => setShowLabelFor(null)} className="text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1">
                <X size={20} />
              </button>
            </div>
            
            {/* The Label to Print */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center bg-white mb-6">
              <QRCodeSVG 
                value={showLabelFor.sku} 
                size={160}
                level="M"
                includeMargin={false}
              />
              <div className="text-center mt-4 w-full">
                <p className="font-bold text-gray-900 text-lg leading-tight mb-1">{showLabelFor.name}</p>
                <p className="text-gray-500 font-mono text-sm bg-gray-100 py-1 px-2 rounded inline-block">{showLabelFor.sku}</p>
                <p className="text-xs text-gray-400 mt-2 uppercase tracking-widest font-semibold">Scan pour action</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowLabelFor(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Fermer
              </button>
              <button 
                onClick={() => {
                  showToast("Simulation d'impression envoyée à l'imprimante thermique.");
                  setShowLabelFor(null);
                }}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Printer size={18} />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
