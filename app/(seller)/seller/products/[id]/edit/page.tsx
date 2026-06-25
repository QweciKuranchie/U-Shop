"use client";

import React from "react";
import { useSeller } from "../../../SellerContext";
import ProductForm from "../../ProductForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: Props) {
  const { id } = React.use(params);
  const { products, loading } = useSeller();

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-2 border-brand-purple/30 border-t-brand-pink rounded-full animate-spin" />
      </div>
    );
  }

  const product = products.find((p) => p.id === id);

  if (!product) {
    return (
      <div className="text-center py-16">
        <h3 className="font-display font-bold text-lg text-white mb-2">Product Not Found</h3>
        <p className="text-xs text-slate-400">The product you are trying to edit does not exist or has been deleted.</p>
      </div>
    );
  }

  return <ProductForm product={product} />;
}
