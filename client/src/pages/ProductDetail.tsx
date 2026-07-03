import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { useProduct } from "../hooks/useProducts";
import { useCartStore } from "../store/cartStore";
import ImageGallery from "../components/products/ImageGallery";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(Number(id));
  const addToCart = useCartStore((state) => state.addToCart);
  const [selectedVariant, setSelectedVariant] = useState<number | undefined>();
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Link to="/products">
          <Button className="mt-4" variant="outline">
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product.id, quantity, selectedVariant);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Back link */}
      <Link
        to="/products"
        className="mb-6 flex items-center gap-2 text-sm text-muted-foreground hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image Gallery */}
        <ImageGallery images={product.images ?? []} />

        {/* Product Info */}
        <div>
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 text-2xl font-bold">€{product.price}</p>

          {/* Categories */}
          {product.categories?.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.categories.map((cat: { id: number; name: string }) => (
                <Badge key={cat.id} variant="secondary">
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <p className="mt-4 text-muted-foreground">{product.description}</p>
          )}

          {/* Variant Selector */}
          {product.variants?.length > 0 && (
            <div className="mt-6">
              <h3 className="mb-2 text-sm font-medium">Variant</h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v: { id: number; name: string }) => (
                  <Button
                    key={v.id}
                    variant={selectedVariant === v.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedVariant(v.id)}
                  >
                    {v.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium">Quantity</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                -
              </Button>
              <span className="w-8 text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </Button>
            </div>
          </div>

          {/* Stock info */}
          <p className="mt-4 text-sm text-muted-foreground">
            {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
          </p>

          {/* Add to Cart */}
          <Button
            className="mt-6 w-full md:w-auto"
            size="lg"
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
          >
            <ShoppingCart className="mr-2 h-5 w-5" />
            Add to Cart
          </Button>
        </div>
      </div>
    </div>
  );
}
