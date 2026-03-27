import React, { useState, useEffect } from 'react';
import { useInventory } from './hooks/useInventory';
import { Dashboard } from './views/Dashboard';
import { Catalog } from './views/Catalog';
import { Pos } from './views/Pos';
import { LayoutDashboard, PackageSearch, ShoppingCart, Settings as SettingsIcon, LogIn } from 'lucide-react';
import { Settings } from './views/Settings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

function AppContent() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const { products, logs, updateStock, addProduct, deleteProduct, importProducts, updateProduct, isLoaded } = useInventory(userId);
  const [currentView, setCurrentView] = useState<'dashboard' | 'catalog' | 'pos' | 'settings'>('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        // Ensure user document exists
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            email: user.email,
            name: user.displayName || '',
            role: 'user', // Default role
            createdAt: new Date().toISOString()
          });
        }
      } else {
        setUserId(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUserId(null);
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <PackageSearch size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">StudioStock</h1>
          <p className="text-gray-500 mb-8">Connectez-vous pour accéder à votre inventaire synchronisé dans le cloud.</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Connexion avec Google
          </button>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48"></div>
        </div>
      </div>
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard products={products} logs={logs} onNavigate={setCurrentView} />;
      case 'catalog':
        return <Catalog products={products} onNavigate={setCurrentView} onUpdateStock={updateStock} onAddProduct={addProduct} onUpdateProduct={updateProduct} onDeleteProduct={deleteProduct} />;
      case 'pos':
        return <Pos products={products} onUpdateStock={updateStock} />;
      case 'settings':
        return <Settings products={products} onImport={importProducts} onLogout={handleLogout} />;
      default:
        return <Dashboard products={products} logs={logs} onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      {/* Main Content Area */}
      <main className="h-screen overflow-hidden">
        {renderView()}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 px-6 py-3 pb-safe">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <button 
            onClick={() => setCurrentView('dashboard')} 
            className={`flex flex-col items-center gap-1 p-2 ${currentView === 'dashboard' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-medium">Accueil</span>
          </button>
          
          <button 
            onClick={() => setCurrentView('catalog')} 
            className={`flex flex-col items-center gap-1 p-2 ${currentView === 'catalog' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <PackageSearch size={24} />
            <span className="text-[10px] font-medium">Catalogue</span>
          </button>
          
          {/* Prominent POS Button */}
          <div className="relative -top-6">
            <button 
              onClick={() => setCurrentView('pos')}
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                currentView === 'pos' ? 'bg-blue-700 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <ShoppingCart size={28} />
            </button>
          </div>

          <button 
            onClick={() => setCurrentView('settings')} 
            className={`flex flex-col items-center gap-1 p-2 ${currentView === 'settings' ? 'text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <SettingsIcon size={24} />
            <span className="text-[10px] font-medium">Réglages</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}
