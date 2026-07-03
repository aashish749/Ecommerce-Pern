import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Package, ArrowRight, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useOrder } from "@/hooks/useOrders";
import type { Order, OrderItem } from "@/types";

function StatusBadge({ status }: { status: Order["status"] }) {
  const variantMap: Record<Order["status"], string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    shipped: "bg-blue-100 text-blue-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return (
    <Badge className={variantMap[status]}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const { data: order, isLoading, isError } = useOrder(Number(orderId));

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-16 w-16 bg-muted rounded-full mx-auto" />
          <div className="h-8 bg-muted rounded w-64 mx-auto" />
          <div className="h-4 bg-muted rounded w-48 mx-auto" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl text-center space-y-6">
        <Package className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Order not found</h1>
        <p className="text-muted-foreground">
          We couldn't find your order. Please check your order history.
        </p>
        <Button asChild>
          <Link to="/orders">View Orders</Link>
        </Button>
      </div>
    );
  }

  // Debug: log the full order data to console
  console.log("[OrderSuccess] order:", order);
  console.log("[OrderSuccess] order.items:", order.items);
  if (order.items && order.items.length > 0) {
    console.log("[OrderSuccess] first item:", order.items[0]);
  }

  // Compute total amount using either snake_case or camelCase field from the API
  const totalAmount = (() => {
    const raw = (order as any).total_amount ?? (order as any).totalAmount;
    if (typeof raw === "string") return parseFloat(raw);
    return raw ?? 0;
  })();

  const shipping = order.shipping_address;

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      {/* Success Header */}
      <div className="text-center space-y-4 mb-10">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Order Confirmed!</h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Thank you for your purchase. Your order has been placed successfully.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className="text-sm text-muted-foreground">
            Order #{order.id}
          </span>
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="space-y-6">
        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingBag className="h-5 w-5" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items && order.items.length > 0 ? (
              order.items.map((item: OrderItem) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {item.productImageUrl && (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName ?? "Product"}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    )}
                    <div className="space-y-1">
                      <p className="font-medium">
                        {item.productName ?? `Product #${item.product_id}`}
                      </p>
                      {item.variant_name && (
                        <p className="text-sm text-muted-foreground">
                          Variant: {item.variant_name}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × €
                        {parseFloat(item.unit_price ?? "0").toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="font-medium">
                    €
                    {(
                      parseFloat(item.unit_price ?? "0") * item.quantity
                    ).toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No items found
              </p>
            )}
            <hr className="border-t" />
            <div className="flex justify-between text-lg font-bold pt-2">
              <span>Total</span>
              <span>€{totalAmount.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Address */}
        {shipping && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {shipping.street}
                <br />
                {shipping.city}, {shipping.zip}
                <br />
                {shipping.country}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Order Date */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Order Date</span>
              <span>
                {(order as any).created_at || (order as any).createdAt
                  ? new Date(
                      (order as any).created_at || (order as any).createdAt,
                    ).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Payment Status</span>
              <StatusBadge status={order.status} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
        <Button asChild variant="outline">
          <Link to="/orders">View All Orders</Link>
        </Button>
        <Button asChild>
          <Link to="/products" className="flex items-center gap-2">
            Continue Shopping
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
