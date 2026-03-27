export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  location: string;
  alertThreshold: number;
  isKit: boolean;
  imageUrl?: string;
  ownerId?: string;
  createdAt?: string;
};

export type LogEntry = {
  id: string;
  date: string;
  sku: string;
  productName: string;
  change: number;
  type: 'sale' | 'receive' | 'adjustment';
  ownerId?: string;
};
