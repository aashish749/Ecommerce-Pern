import {
  DollarSign,
  ShoppingCart,
  Users,
  TrendingUp,
  Package,
  Clock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/admin/StatCard";
import AdminSidebar from "@/components/admin/AdminSidebar";
import {
  useAdminStats,
  useRevenueTrend,
  useTopProducts,
  useRecentOrders,
} from "@/hooks/useAdmin";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { RecentOrder } from "@/types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  shipped: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(num);
}

export default function Dashboard() {
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useAdminStats();
  const { data: revenueTrend, isLoading: trendLoading } = useRevenueTrend();
  const { data: topProducts, isLoading: topLoading } = useTopProducts();
  const { data: recentOrders, isLoading: recentLoading } = useRecentOrders();

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6 lg:p-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Overview of your store performance
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : statsError ? (
            <Card className="col-span-full">
              <CardContent className="p-6 text-center text-muted-foreground">
                Failed to load stats
              </CardContent>
            </Card>
          ) : (
            <>
              <StatCard
                icon={DollarSign}
                label="Total Revenue"
                value={formatCurrency(stats?.totalRevenue ?? 0)}
                description="All time"
                trend="up"
              />
              <StatCard
                icon={ShoppingCart}
                label="Total Orders"
                value={stats?.totalOrders ?? 0}
                description="All time"
              />
              <StatCard
                icon={Users}
                label="Total Customers"
                value={stats?.totalCustomers ?? 0}
                description="Registered users"
              />
              <StatCard
                icon={TrendingUp}
                label="30-Day Revenue"
                value={formatCurrency(stats?.revenue30Days ?? 0)}
                description={`${stats?.orders30Days ?? 0} orders in last 30 days`}
                trend="up"
              />
            </>
          )}
        </div>

        {/* Revenue Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Revenue Trend (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : revenueTrend && revenueTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrend}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => {
                      const d = new Date(val);
                      return d.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      });
                    }}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => `€${val}`}
                  />
                  <Tooltip
                    formatter={(value) => [`€${value}`, "Revenue"]}
                    labelFormatter={(label) =>
                      new Date(label).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-16">
                No revenue data available yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Bottom Grid: Top Products + Recent Orders */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Package className="h-5 w-5 text-primary" />
                Top 5 Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              {topLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : topProducts && topProducts.length > 0 ? (
                <div className="space-y-3">
                  {topProducts.map(
                    (
                      product: { id: number; name: string; totalSold: string },
                      index: number,
                    ) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between py-2 border-b last:border-0"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-muted-foreground w-6">
                            #{index + 1}
                          </span>
                          <span className="text-sm font-medium">
                            {product.name}
                          </span>
                        </div>
                        <Badge variant="secondary">
                          {product.totalSold} sold
                        </Badge>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No products sold yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Recent Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : recentOrders && recentOrders.length > 0 ? (
                <div className="space-y-3">
                  {recentOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between py-2 border-b last:border-0"
                    >
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Order #{order.id}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer?.name ?? order.userName ?? "Unknown"}{" "}
                          • {order.itemsCount ?? order.itemCount ?? 0} items
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-sm font-medium">
                          {formatCurrency(order.totalAmount)}
                        </p>
                        <Badge
                          className={
                            statusColors[order.status] ||
                            "bg-gray-100 text-gray-800"
                          }
                        >
                          {order.status.charAt(0).toUpperCase() +
                            order.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No orders yet
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
