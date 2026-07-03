import { useState } from "react";
import { ShoppingCart, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAdminOrders, useUpdateOrderStatus } from "@/hooks/useAdmin";
import type { Order, OrderItem } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusOptions = ["pending", "paid", "shipped", "cancelled"] as const;

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

function OrderRow({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false);
  const updateStatus = useUpdateOrderStatus();

  const totalAmount = (() => {
    const raw = (order as any).total_amount ?? (order as any).totalAmount;
    if (typeof raw === "string") return parseFloat(raw);
    return raw ?? 0;
  })();

  const customerName =
    (order as any).customer?.name ??
    (order as any).userName ??
    (order as any).user_name ??
    "Unknown";
  const itemCount =
    (order as any).itemsCount ??
    (order as any).itemCount ??
    order.items?.length ??
    0;

  const handleStatusChange = (newStatus: string) => {
    updateStatus.mutate(
      { id: order.id, data: { status: newStatus as Order["status"] } },
      {
        onSuccess: () => toast.success("Order status updated"),
        onError: () => toast.error("Failed to update status"),
      },
    );
  };

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
              {customerName} • {itemCount} items
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-medium">{formatCurrency(totalAmount)}</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t p-4 space-y-4 bg-muted/30">
          {/* Status control */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Status:</span>
            <Select
              defaultValue={order.status}
              onValueChange={handleStatusChange}
              disabled={updateStatus.isPending}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    <Badge className={statusColors[s]}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </Badge>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Order items */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Items</p>
            {order.items?.map((item: OrderItem) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm"
              >
                <div>
                  <span className="font-medium">
                    {item.productName ??
                      `Product #${item.product_id ?? item.productId}`}
                  </span>
                  {item.variant_name && (
                    <span className="text-muted-foreground">
                      {" "}
                      — {item.variant_name}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {" "}
                    × {item.quantity}
                  </span>
                </div>
                <span>
                  €
                  {(
                    parseFloat(item.unit_price ?? item.unitPrice ?? "0") *
                    item.quantity
                  ).toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Shipping address */}
          {(order as any).shipping_address || (order as any).shippingAddress ? (
            <div className="text-sm">
              <p className="font-medium mb-1">Shipping Address</p>
              <p className="text-muted-foreground">
                {
                  (
                    (order as any).shipping_address ??
                    (order as any).shippingAddress
                  )?.street
                }
                <br />
                {
                  (
                    (order as any).shipping_address ??
                    (order as any).shippingAddress
                  )?.city
                }
                ,{" "}
                {
                  (
                    (order as any).shipping_address ??
                    (order as any).shippingAddress
                  )?.zip
                }
                <br />
                {
                  (
                    (order as any).shipping_address ??
                    (order as any).shippingAddress
                  )?.country
                }
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const {
    data: rawData,
    isLoading,
    isError,
  } = useAdminOrders(statusFilter ? { status: statusFilter } : undefined);

  // Backend returns { orders: [...], pagination: {...} }
  const orders: Order[] = Array.isArray(rawData)
    ? rawData
    : ((rawData as any)?.orders ?? []);

  const filteredOrders = orders.filter((order: Order) => {
    if (!search) return true;
    const query = search.toLowerCase();
    const customerName = (
      (order as any).customer?.name ??
      (order as any).userName ??
      ""
    ).toLowerCase();
    return String(order.id).includes(query) || customerName.includes(query);
  });

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">
            View and manage all customer orders
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val === "all" ? "" : val)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statusOptions.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Orders {filteredOrders.length > 0 && `(${filteredOrders.length})`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : isError ? (
              <p className="text-center text-muted-foreground py-8">
                Failed to load orders
              </p>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No orders found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order: Order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
