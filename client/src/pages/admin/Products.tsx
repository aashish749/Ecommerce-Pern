import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Package,
  Loader2,
  ImagePlus,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { productsApi } from "@/api/products";
import axios from "@/api/axios";
import type { Product, Category, ProductVariant } from "@/types";

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  categoryIds: number[];
  variantNames: string;
  images: File[];
  existingImages: string[];
}

const emptyForm: ProductFormData = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  categoryIds: [],
  variantNames: "",
  images: [],
  existingImages: [],
};

function ProductDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
  categories: Category[];
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>(() => {
    if (product) {
      return {
        name: product.name,
        description: product.description ?? "",
        price: String(product.price),
        stock: String(product.stock),
        categoryIds: product.categories?.map((c: Category) => c.id) ?? [],
        variantNames:
          product.variants?.map((v: ProductVariant) => v.name).join(", ") ?? "",
        images: [],
        existingImages:
          product.images
            ?.map(
              (i: { image_url?: string; imageUrl?: string }) =>
                i.image_url ?? i.imageUrl ?? "",
            )
            .filter(Boolean) ?? [],
      };
    }
    return { ...emptyForm };
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper: upload images to Cloudinary via /api/upload
  const uploadImages = async (files: File[]): Promise<string[]> => {
    if (files.length === 0) return [];
    const fd = new FormData();
    files.forEach((file) => fd.append("images", file));
    const { data } = await axios.post("/api/upload", fd);
    return data.urls ?? [];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) {
      toast.error("Valid price is required");
      return;
    }

    setIsSubmitting(true);
    try {
      // Step 1: Upload any new images to Cloudinary
      const newUrls = await uploadImages(form.images);

      // Step 2: Build payload with all image URLs (existing + new)
      const imageUrls = [...form.existingImages, ...newUrls];

      // Step 3: Send JSON to the backend create/update endpoint
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock || 0),
        categoryIds: form.categoryIds,
        variantNames: form.variantNames
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        imageUrls,
      };

      if (product) {
        await productsApi.update(product.id, payload);
        toast.success("Product updated successfully");
      } else {
        await productsApi.create(payload);
        toast.success("Product created successfully");
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save product";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setForm((prev) => ({ ...prev, images: [...prev.images, ...files] }));
  };

  const removeNewImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
          <DialogDescription>
            {product
              ? "Update product details, images, variants, and categories."
              : "Create a new product with images, variants, and categories."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Classic Cotton T-Shirt"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Product description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (€) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, price: e.target.value }))
                }
                placeholder="29.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, stock: e.target.value }))
                }
                placeholder="100"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const selected = form.categoryIds.includes(cat.id);
                return (
                  <Badge
                    key={cat.id}
                    variant={selected ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        categoryIds: selected
                          ? prev.categoryIds.filter((id) => id !== cat.id)
                          : [...prev.categoryIds, cat.id],
                      }))
                    }
                  >
                    {cat.name}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="variantNames">Variants (comma-separated)</Label>
            <Input
              id="variantNames"
              value={form.variantNames}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  variantNames: e.target.value,
                }))
              }
              placeholder="Red, Blue, Green"
            />
            <p className="text-xs text-muted-foreground">
              Enter variant names separated by commas
            </p>
          </div>

          <div className="space-y-2">
            <Label>Images</Label>
            {/* Existing images */}
            {form.existingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {form.existingImages.map((url, i) => (
                  <div
                    key={i}
                    className="relative h-16 w-16 rounded border overflow-hidden"
                  >
                    <img
                      src={url}
                      alt={`Image ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
            {/* New images */}
            <div className="flex flex-wrap gap-2">
              {form.images.map((file, i) => (
                <div
                  key={i}
                  className="relative h-16 w-16 rounded border overflow-hidden group"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeNewImage(i)}
                    className="absolute top-0 right-0 bg-black/50 text-white rounded-bl p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="h-16 w-16 rounded border border-dashed flex items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {product ? "Update Product" : "Create Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminProducts() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const { data, isLoading, isError } = useProducts({
    search: search || undefined,
    limit: 100,
  });
  const { data: categories } = useCategories();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`Delete "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const products = data?.data ?? [];
  const cats = categories ?? [];

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products</h1>
            <p className="text-muted-foreground mt-1">
              Manage your product catalog
            </p>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Products ({products.length})</CardTitle>
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
                Failed to load products
              </p>
            ) : products.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">No products found</p>
                <Button variant="outline" onClick={handleAdd}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add your first product
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                      <th className="pb-3 pr-4">Product</th>
                      <th className="pb-3 pr-4">Price</th>
                      <th className="pb-3 pr-4">Stock</th>
                      <th className="pb-3 pr-4">Categories</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product: Product) => (
                      <tr
                        key={product.id}
                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-muted overflow-hidden flex-shrink-0">
                              {product.images?.[0]?.image_url ||
                              product.images?.[0]?.imageUrl ? (
                                <img
                                  src={
                                    product.images[0].image_url ??
                                    product.images[0].imageUrl
                                  }
                                  alt={product.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Package className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {product.name}
                              </p>
                              {product.variants &&
                                product.variants.length > 0 && (
                                  <p className="text-xs text-muted-foreground">
                                    {product.variants
                                      .map((v: ProductVariant) => v.name)
                                      .join(", ")}
                                  </p>
                                )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-sm">
                          €{Number(product.price).toFixed(2)}
                        </td>
                        <td className="py-3 pr-4 text-sm">{product.stock}</td>
                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-1">
                            {product.categories?.map((cat: Category) => (
                              <Badge
                                key={cat.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {cat.name}
                              </Badge>
                            )) ?? null}
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant={
                              (product.is_active ?? product.isActive) !== false
                                ? "default"
                                : "outline"
                            }
                          >
                            {(product.is_active ?? product.isActive) !== false
                              ? "Active"
                              : "Inactive"}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(product)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete(product.id, product.name)
                              }
                              disabled={deleteMutation.isPending}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Dialog */}
        <ProductDialog
          key={editingProduct?.id ?? "new"}
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditingProduct(null);
          }}
          product={editingProduct}
          categories={cats}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ["products"] });
          }}
        />
      </div>
    </div>
  );
}
