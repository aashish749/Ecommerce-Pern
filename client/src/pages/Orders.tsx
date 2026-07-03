import { useState } from "react";
import { Link } from "react-router-dom";
import { Package, ChevronDown, ChevronUp, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/useOrders";
import type { Order } from "@/types";

const statusColors: Record<Order["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const totalAmount = parseFloat(order.totalAmount ?? "0");

  return (
    <div className="border rounded-lg">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="text-left">
            <p className="font-medium">Order #{order.id}</p>
            <p className="text-sm text-muted-foreground">
              {order.created_at
                ? new Date(order.created_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge className={statusColors[order.status]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Badge>
          <span className="font-medium">€{totalAmount.toFixed(2)}</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && order.items && order.items.length > 0 && (
        <div className="border-t p-4 space-y-3 bg-muted/30">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {item.productName ?? `Product #${item.product_id}`}
                  {item.variant_name && (
                    <span className="text-muted-foreground">
                      {" "}
                      — {item.variant_name}
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  Qty: {item.quantity} × €
                  {parseFloat(item.unit_price ?? "0").toFixed(2)}
                </p>
              </div>
              <p className="text-sm font-medium">
                €
                {(parseFloat(item.unit_price ?? "0") * item.quantity).toFixed(
                  2,
                )}
              </p>
            </div>
          ))}

          {order.shipping_address && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground font-medium mb-1">
                Shipping Address
              </p>
              <p className="text-sm text-muted-foreground">
                {order.shipping_address.street}
                <br />
                {order.shipping_address.city}, {order.shipping_address.zip}
                <br />
                {order.shipping_address.country}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const { data: orders, isLoading, isError } = useOrders();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center space-y-4">
        <Package className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Failed to load orders</h1>
        <p className="text-muted-foreground">Please try again later.</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-4xl text-center space-y-4">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">No orders yet</h1>
        <p className="text-muted-foreground">
          When you place orders, they will appear here.
        </p>
        <Button asChild>
          <Link to="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Order History</h1>
        <p className="text-muted-foreground mt-1">View and track your orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {orders.map((order: Order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
