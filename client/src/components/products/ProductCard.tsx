import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import type { Product } from "../../types";

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const firstImage = product.images?.[0]?.imageUrl;
  const categoryNames = product.categories?.map((c) => c.name) ?? [];

  return (
    <Card className="overflow-hidden">
      <Link to={`/products/${product.id}`}>
        <div className="aspect-square overflow-hidden bg-muted">
          {firstImage ? (
            <img
              src={firstImage}
              alt={product.name}
              className="h-full w-full object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <Link to={`/products/${product.id}`}>
          <h3 className="font-semibold hover:underline">{product.name}</h3>
        </Link>
        <p className="mt-1 text-lg font-bold">€{product.price}</p>

        {categoryNames.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {categoryNames.map((name) => (
              <Badge key={name} variant="secondary" className="text-xs">
                {name}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          size="lg"
          onClick={() => onAddToCart(product.id)}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </CardFooter>
    </Card>
  );
}
