import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useProducts } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useCartStore } from "../store/cartStore";
import ProductGrid from "../components/products/ProductGrid";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Skeleton } from "../components/ui/skeleton";

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");

  const categoryParam = searchParams.get("category") || undefined;
  const searchParam = searchParams.get("search") || undefined;
  const page = parseInt(searchParams.get("page") || "1", 10);

  const { data, isLoading } = useProducts({
    category: categoryParam,
    search: searchParam,
    page,
    limit: 12,
  });
  const { data: categories } = useCategories();
  const addToCart = useCartStore((state) => state.addToCart);

  const products = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.total / (data.limit || 12)) : 1;

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    setSearchParams(params);
  };

  const handleCategoryFilter = (categoryId: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (categoryId) {
      params.set("category", categoryId);
    } else {
      params.delete("category");
    }
    params.delete("page");
    setSearchParams(params);
  };

  const goToPage = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    setSearchParams(params);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">Products</h1>

      {/* Search & Filter */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex w-full max-w-sm gap-2">
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={!categoryParam ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryFilter(undefined)}
          >
            All
          </Button>
          {categories?.map((cat: { id: number; name: string }) => (
            <Button
              key={cat.id}
              variant={categoryParam === String(cat.id) ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryFilter(String(cat.id))}
            >
              {cat.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-square w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <ProductGrid
          products={products}
          onAddToCart={(productId) => addToCart(productId, 1)}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => goToPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => goToPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
