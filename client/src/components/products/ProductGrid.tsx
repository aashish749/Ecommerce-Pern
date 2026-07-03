import ProductCard from "./ProductCard";
import type { Product } from "../../types";

interface ProductGridProps {
  products: Product[];
  onAddToCart: (productId: number) => void;
}

export default function ProductGrid({
  products,
  onAddToCart,
}: ProductGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
        />
      ))}
    </div>
  );
}
