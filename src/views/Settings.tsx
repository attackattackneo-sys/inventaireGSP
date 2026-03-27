import React, { useState } from 'react';
import { Product } from '../types';
import { Settings as SettingsIcon, Download, Upload, Database, ShieldCheck, CheckCircle, AlertTriangle, LogOut } from 'lucide-react';

interface SettingsProps {
  products: Product[];
  onImport: (products: Product[]) => void;
  onLogout: () => void;
}

export function Settings({ products, onImport, onLogout }: SettingsProps) {
  const [confirmImport, setConfirmImport] = useState<Product[] | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleExportCSV = () => {
    if (products.length === 0) {
      setErrorMsg("Aucun produit à exporter.");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    const headers = ['id', 'name', 'sku', 'category', 'price', 'stock', 'location', 'alertThreshold', 'isKit'];
    const csvContent = [
      headers.join(','),
      ...products.map(p => [
        p.id,
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        `"${p.category}"`,
        p.price,
        p.stock,
        `"${p.location}"`,
        p.alertThreshold,
        p.isKit
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `studiostock_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setToastMsg("Exportation réussie !");
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          setErrorMsg("Le fichier CSV semble vide ou invalide.");
          setTimeout(() => setErrorMsg(null), 3000);
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        const importedProducts: Product[] = lines.slice(1).map((line, index) => {
          // Simple CSV parsing (doesn't handle commas inside quotes perfectly, but good enough for MVP)
          const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
          
          return {
            id: values[headers.indexOf('id')] || Date.now().toString() + index,
            name: values[headers.indexOf('name')] || 'Produit Importé',
            sku: values[headers.indexOf('sku')] || `IMP-${Date.now()}-${index}`,
            category: values[headers.indexOf('category')] || 'Autre',
            price: parseFloat(values[headers.indexOf('price')]) || 0,
            stock: parseInt(values[headers.indexOf('stock')]) || 0,
            location: values[headers.indexOf('location')] || 'Magasin',
            alertThreshold: parseInt(values[headers.indexOf('alertThreshold')]) || 5,
            isKit: values[headers.indexOf('isKit')] === 'true',
            imageUrl: '' // Images are not exported/imported via CSV in this MVP
          };
        });

        setConfirmImport(importedProducts);
      } catch (error) {
        console.error("Erreur d'importation", error);
        setErrorMsg("Erreur lors de la lecture du fichier CSV.");
        setTimeout(() => setErrorMsg(null), 3000);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  const executeImport = () => {
    if (confirmImport) {
      onImport(confirmImport);
      setConfirmImport(null);
      setToastMsg('Importation réussie !');
      setTimeout(() => setToastMsg(null), 3000);
    }
  };

  return (
    <div className="p-4 h-full flex flex-col pb-24 relative">
      {/* Toast Notifications */}
      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle size={20} className="text-green-400" />
          <p className="font-medium text-sm">{toastMsg}</p>
        </div>
      )}
      
      {errorMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-in slide-in-from-top-4">
          <AlertTriangle size={20} className="text-white" />
          <p className="font-medium text-sm">{errorMsg}</p>
        </div>
      )}

      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <SettingsIcon className="text-gray-900" />
          Réglages
        </h1>
        <p className="text-sm text-gray-500 mt-1">Gérez vos données et préférences</p>
      </header>

      <div className="space-y-6">
        {/* Data Management Section */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Database size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Données (CSV)</h2>
          </div>
          
          <p className="text-sm text-gray-500 mb-5">
            Sauvegardez votre catalogue ou importez une liste existante. L'importation remplacera les données actuelles.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleExportCSV}
              className="flex flex-col items-center justify-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-4 hover:bg-gray-100 hover:border-gray-300 transition-colors active:scale-95"
            >
              <Download size={24} className="text-gray-700" />
              <span className="text-sm font-semibold text-gray-900">Exporter</span>
            </button>

            <label className="flex flex-col items-center justify-center gap-2 bg-blue-50 border border-blue-200 rounded-xl p-4 hover:bg-blue-100 hover:border-blue-300 transition-colors cursor-pointer active:scale-95">
              <Upload size={24} className="text-blue-700" />
              <span className="text-sm font-semibold text-blue-900">Importer</span>
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                onChange={handleImportCSV}
              />
            </label>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-green-100 p-2 rounded-lg text-green-600">
              <ShieldCheck size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Cloud & Sécurité</h2>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed mb-4">
            <p className="mb-2">
              <strong>StudioStock</strong> est maintenant connecté au cloud.
            </p>
            <p>
              Toutes vos données (produits, historique, images) sont stockées <strong>de manière sécurisée sur les serveurs Google</strong>. Vous pouvez y accéder depuis n'importe quel appareil en vous connectant avec votre compte.
            </p>
          </div>

          <button 
            onClick={onLogout}
            className="w-full bg-red-50 text-red-600 border border-red-200 font-bold py-3 px-4 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={20} />
            Se déconnecter
          </button>
        </section>
      </div>

      {/* Import Confirmation Modal */}
      {confirmImport && (
        <div className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-4 text-blue-600">
              <Database size={24} />
              <h2 className="text-xl font-bold text-gray-900">Confirmer l'importation</h2>
            </div>
            <p className="text-gray-500 mb-6">
              Vous allez importer <strong>{confirmImport.length} produits</strong>. Cette action remplacera l'intégralité de votre catalogue actuel. Voulez-vous continuer ?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmImport(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={executeImport}
                className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Importer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
