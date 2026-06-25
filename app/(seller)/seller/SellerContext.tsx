"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface ProductItem {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  vendorPrice: string;
  listingPrice: string;
  commissionRate: string;
  imageS3Keys: string[];
  status: "ACTIVE" | "PAUSED" | "SOLD" | "DELETED";
  createdAt: string;
}

export interface SellerInfo {
  id: string;
  commissionRate: string;
  tier: string;
  campus: string | null;
  storeName: string;
  handle: string;
}

interface SellerContextType {
  seller: SellerInfo | null;
  products: ProductItem[];
  loading: boolean;
  error: string;
  fetchData: () => Promise<void>;
  setProducts: React.Dispatch<React.SetStateAction<ProductItem[]>>;
  setError: React.Dispatch<React.SetStateAction<string>>;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

export function SellerProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [seller, setSeller] = useState<SellerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/products");
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to load products");
        return;
      }
      const data = await res.json();
      setProducts(data.products);
      setSeller(data.seller);
    } catch {
      setError("Network error loading data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <SellerContext.Provider value={{ seller, products, loading, error, fetchData, setProducts, setError }}>
      {children}
    </SellerContext.Provider>
  );
}

export function useSeller() {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error("useSeller must be used within a SellerProvider");
  }
  return context;
}
