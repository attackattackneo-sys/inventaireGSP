import { AlertTriangle, Package, TrendingUp, Clock } from 'lucide-react';
import { Product, LogEntry } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardProps {
  products: Product[];
  logs: LogEntry[];
  onNavigate: (view: string) => void;
}

export function Dashboard({ products, logs, onNavigate }: DashboardProps) {
  const criticalStocks = products.filter(p => p.stock <= p.alertThreshold && !p.isKit);
  
  // Calculate top sales (simplified for MVP: just count negative changes in logs)
  const salesLogs = logs.filter(l => l.type === 'sale' && l.change < 0);
  const salesCount: Record<string, number> = {};
  salesLogs.forEach(log => {
    salesCount[log.productName] = (salesCount[log.productName] || 0) + Math.abs(log.change);
  });
  
  const topSales = Object.entries(salesCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">StudioStock</h1>
          <p className="text-sm text-gray-500">Bonjour, Grégory !</p>
        </div>
        <button 
          onClick={() => onNavigate('pos')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm flex items-center gap-2"
        >
          <Package size={18} />
          <span>CAISSE</span>
        </button>
      </header>

      {/* Critical Stocks Alert */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="text-red-500" size={20} />
          <h2 className="text-lg font-semibold text-gray-800">STOCKS CRITIQUES ({criticalStocks.length})</h2>
        </div>
        
        {criticalStocks.length > 0 ? (
          <div className="bg-red-50 border border-red-100 rounded-xl overflow-hidden shadow-sm">
            {criticalStocks.map((product, idx) => (
              <div 
                key={product.id} 
                className={`p-3 flex justify-between items-center ${idx !== criticalStocks.length - 1 ? 'border-b border-red-100' : ''}`}
              >
                <div>
                  <p className="font-medium text-red-900">{product.name}</p>
                  <p className="text-xs text-red-700">SKU: {product.sku}</p>
                </div>
                <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                  Reste {product.stock}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-green-50 text-green-800 p-4 rounded-xl text-sm font-medium border border-green-100">
            Tous les stocks sont au-dessus des seuils d'alerte.
          </div>
        )}
      </section>

      {/* Top Sales */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="text-blue-500" size={20} />
          <h2 className="text-lg font-semibold text-gray-800">TOP VENTES RÉCENTES</h2>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {topSales.length > 0 ? topSales.map(([name, count], idx) => (
            <div key={`topsale-${name}-${idx}`} className={`p-3 flex justify-between items-center ${idx !== topSales.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 text-blue-800 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                  {idx + 1}
                </div>
                <p className="font-medium text-gray-800">{name}</p>
              </div>
              <p className="text-sm text-gray-500 font-medium">{count} vendus</p>
            </div>
          )) : (
            <div className="p-4 text-sm text-gray-500 text-center">Aucune vente récente enregistrée.</div>
          )}
        </div>
      </section>

      {/* Recent Activity */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="text-gray-500" size={20} />
          <h2 className="text-lg font-semibold text-gray-800">DERNIERS MOUVEMENTS</h2>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {logs.slice(0, 5).map((log, idx) => (
            <div key={log.id} className={`p-3 flex justify-between items-center ${idx !== 4 ? 'border-b border-gray-100' : ''}`}>
              <div>
                <p className="font-medium text-gray-800 text-sm">{log.productName}</p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(log.date), { addSuffix: true, locale: fr })}
                </p>
              </div>
              <div className={`px-2 py-1 rounded text-xs font-bold ${
                log.change > 0 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
              }`}>
                {log.change > 0 ? '+' : ''}{log.change}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-4 text-sm text-gray-500 text-center">Aucun mouvement récent.</div>
          )}
        </div>
      </section>
    </div>
  );
}
