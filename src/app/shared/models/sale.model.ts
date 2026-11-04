export interface SaleRequest {
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

export interface SaleResponse {
  saleId: number;
  userId: number;
  username: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
    remainingStock: number;
  }>;
  total: number;
  createdAt: string;
}
