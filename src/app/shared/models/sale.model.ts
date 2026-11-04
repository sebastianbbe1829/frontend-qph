export interface SaleRequest {
  productId: number;
  quantity: number;
}

export interface SaleResponse {
  saleId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  remainingStock: number;
  createdAt: string;
}
