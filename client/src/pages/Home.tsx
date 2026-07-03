import { Link } from "react-router-dom";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useCartStore } from "../store/cartStore";
import ProductGrid from "../components/products/ProductGrid";
import { Button } from "../components/ui/button";

export default function Home() {
  const { data: productsData } = useProducts({ limit: 4 });
  const { data: categories } = useCategories();
  const addToCart = useCartStore((state) => state.addToCart);

  const products = productsData?.data ?? [];

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-gradient-to-r from-primary/10 to-primary/5 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Welcome to Shop
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Discover amazing products at great prices
        </p>
        <Link to="/products">
          <Button className="mt-8" size="lg">
            Browse All Products
          </Button>
        </Link>
      </section>

      {/* Category Links */}
      {categories && categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-semibold">Shop by Category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat: { id: number; name: string }) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.id}`}
                className="rounded-full border px-4 py-2 text-sm font-medium transition-colors hover:bg-primary hover:text-primary-foreground"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="mx-auto max-w-7xl px-4 pb-12">
        <h2 className="mb-6 text-2xl font-semibold">Featured Products</h2>
        <ProductGrid
          products={products}
          onAddToCart={(productId) => addToCart(productId, 1)}
        />
        <div className="mt-8 text-center">
          <Link to="/products">
            <Button variant="outline">View All Products</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
