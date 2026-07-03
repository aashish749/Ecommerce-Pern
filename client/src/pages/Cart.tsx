import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Trash2, ShoppingBag, ArrowLeft } from "lucide-react";
import { useCartStore } from "../store/cartStore";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Skeleton } from "../components/ui/skeleton";

export default function Cart() {
  const { items, loading, fetchCart, updateQuantity, removeItem, cartTotal } =
    useCartStore();

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Skeleton className="mb-6 h-8 w-32" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-muted-foreground">
          Add some products to get started
        </p>
        <Link to="/products">
          <Button className="mt-6">Browse Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Shopping Cart</h1>
        <span className="text-sm text-muted-foreground">
          {items.length} item{items.length !== 1 && "s"}
        </span>
      </div>

      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="flex items-center gap-4 p-4">
              {/* Product image */}
              <Link
                to={`/products/${item.productId}`}
                className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-muted"
              >
                {item.product.images?.[0]?.imageUrl ? (
                  <img
                    src={item.product.images[0].imageUrl}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    No img
                  </div>
                )}
              </Link>

              {/* Product info */}
              <div className="min-w-0 flex-1">
                <Link
                  to={`/products/${item.productId}`}
                  className="font-semibold hover:underline"
                >
                  {item.product.name}
                </Link>
                {item.variant && (
                  <p className="text-sm text-muted-foreground">
                    Variant: {item.variant.name}
                  </p>
                )}
                <p className="mt-1 text-sm font-medium">
                  €{item.product.price}
                </p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() =>
                    updateQuantity(item.id, Math.max(1, item.quantity - 1))
                  }
                >
                  -
                </Button>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (val >= 1) updateQuantity(item.id, val);
                  }}
                  className="h-8 w-14 text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  min={1}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                >
                  +
                </Button>
              </div>

              {/* Subtotal */}
              <div className="w-24 text-right">
                <p className="font-semibold">
                  €{((item.product.price as number) * item.quantity).toFixed(2)}
                </p>
              </div>

              {/* Remove */}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => removeItem(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Cart Summary */}
      <div className="mt-8 rounded-lg border p-6">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span>€{cartTotal().toFixed(2)}</span>
        </div>
        <Link to="/checkout">
          <Button className="mt-4 w-full" size="lg">
            Proceed to Checkout
          </Button>
        </Link>
        <Link
          to="/products"
          className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
