import { useState, useEffect } from 'react';
import { Product, LogEntry } from '../types';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, where, getDocFromServer, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';

export function useInventory(userId: string | null) {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Test connection on mount
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Sync with Firestore
  useEffect(() => {
    if (!userId) {
      setProducts([]);
      setLogs([]);
      setIsLoaded(true);
      return;
    }

    const productsRef = collection(db, 'products');
    const qProducts = query(productsRef, where('ownerId', '==', userId));

    const unsubscribeProducts = onSnapshot(qProducts, (snapshot) => {
      const fetchedProducts: Product[] = [];
      snapshot.forEach((doc) => {
        fetchedProducts.push(doc.data() as Product);
      });
      setProducts(fetchedProducts);
      setIsLoaded(true);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    const logsRef = collection(db, 'logs');
    const qLogs = query(logsRef, where('ownerId', '==', userId));

    const unsubscribeLogs = onSnapshot(qLogs, (snapshot) => {
      const fetchedLogs: LogEntry[] = [];
      snapshot.forEach((doc) => {
        fetchedLogs.push(doc.data() as LogEntry);
      });
      // Sort logs by date descending client-side to avoid needing a composite index immediately
      fetchedLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLogs(fetchedLogs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'logs');
    });

    return () => {
      unsubscribeProducts();
      unsubscribeLogs();
    };
  }, [userId]);

  const updateStock = async (sku: string, change: number, type: LogEntry['type']) => {
    if (!userId) return false;

    const product = products.find((p) => p.sku === sku);
    if (!product) return false;

    const newStock = Math.max(0, product.stock + change);
    const updatedProduct = { ...product, stock: newStock };

    try {
      await setDoc(doc(db, 'products', product.id), updatedProduct);
      
      const newLog: LogEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        sku: product.sku,
        productName: product.name,
        change,
        type,
        ownerId: userId
      };
      
      await setDoc(doc(db, 'logs', newLog.id), newLog);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `products/${product.id} or logs`);
      return false;
    }
  };

  const addProduct = async (product: Product) => {
    if (!userId) return;
    try {
      const productWithOwner = { ...product, ownerId: userId, createdAt: new Date().toISOString() };
      await setDoc(doc(db, 'products', product.id), productWithOwner);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `products/${product.id}`);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    if (!userId) return;
    try {
      // Ensure ownerId and createdAt are preserved
      const existingProduct = products.find(p => p.id === updatedProduct.id);
      const productToSave = { 
        ...updatedProduct, 
        ownerId: userId,
        createdAt: existingProduct?.createdAt || new Date().toISOString()
      };
      await setDoc(doc(db, 'products', updatedProduct.id), productToSave);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `products/${updatedProduct.id}`);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!userId) return;
    try {
      await deleteDoc(doc(db, 'products', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `products/${id}`);
    }
  };

  const importProducts = async (importedProducts: Product[]) => {
    if (!userId) return;
    try {
      // For MVP, we just add them one by one. In a real app, use a batch.
      for (const product of importedProducts) {
        const productWithOwner = { 
          ...product, 
          ownerId: userId,
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'products', product.id), productWithOwner);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'products (import)');
    }
  };

  return {
    products,
    logs,
    isLoaded,
    updateStock,
    addProduct,
    updateProduct,
    deleteProduct,
    importProducts,
  };
}
