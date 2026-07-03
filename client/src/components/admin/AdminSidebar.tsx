import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLink {
  to: string;
  icon: LucideIcon;
  label: string;
}

const links: SidebarLink[] = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/products", icon: Package, label: "Products" },
  { to: "/admin/orders", icon: ShoppingCart, label: "Orders" },
];

export default function AdminSidebar() {
  return (
    <aside className="w-64 border-r bg-muted/30 hidden md:block">
      <div className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">Admin Panel</h2>
        <p className="text-xs text-muted-foreground mt-1">Manage your store</p>
      </div>
      <nav className="space-y-1 px-3">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/admin"}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )
            }
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
