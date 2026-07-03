import { Request, Response } from "express";
import { db } from "../db";
import {
  products,
  productImages,
  productVariants,
  productCategories,
} from "../db/schema";
import { eq, and, or, ilike, inArray, sql } from "drizzle-orm";

export const productController = {
  // ------------------------------------------------------------
  // Public: list products with pagination, search, category filter
  // ------------------------------------------------------------
  list: async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const categoryId = req.query.category
      ? parseInt(req.query.category as string)
      : null;
    const search = req.query.search as string;

    const searchPattern = search ? `%${search}%` : "";

    // Resolve category product IDs eagerly – gives us a plain number[] instead of a query builder
    let categoryProductIds: number[] = [];
    if (categoryId) {
      const rows = await db
        .select({ productId: productCategories.productId })
        .from(productCategories)
        .where(eq(productCategories.categoryId, categoryId));
      categoryProductIds = rows.map((r) => r.productId);
    }

    // 1. Fetch products using relational query
    const rawProducts = await db.query.products.findMany({
      limit,
      offset,
      where: (fields, { eq, and, or, ilike, inArray }) => {
        const conditions = [eq(fields.isActive, true)];

        if (search) {
          conditions.push(
            or(
              ilike(fields.name, searchPattern),
              ilike(fields.description, searchPattern),
            )!,
          );
        }

        if (categoryProductIds.length > 0) {
          conditions.push(inArray(fields.id, categoryProductIds));
        }

        return and(...conditions);
      },
      with: {
        images: {
          orderBy: (images, { asc }) => [asc(images.displayOrder)],
        },
        variants: true,
        productCategories: {
          with: {
            category: true,
          },
        },
      },
    });

    // Shape the result – remove the join wrapper
    const productsWithRelations = rawProducts.map((p) => ({
      ...p,
      categories: p.productCategories.map((pc) => pc.category),
      productCategories: undefined,
    }));

    // 2. Get total count using the same filters
    let countWhere = eq(products.isActive, true);
    if (search) {
      countWhere = and(
        countWhere,
        or(
          ilike(products.name, searchPattern),
          ilike(products.description, searchPattern),
        ),
      )!;
    }
    if (categoryProductIds.length > 0) {
      countWhere = and(countWhere, inArray(products.id, categoryProductIds))!;
    }

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(countWhere);

    const total = Number(totalResult[0]?.count || 0);

    res.json({
      data: productsWithRelations,
      total,
      page,
      limit,
    });
  },

  // ------------------------------------------------------------
  // Public: get a single product by ID
  // ------------------------------------------------------------
  getOne: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);

    const product = await db.query.products.findFirst({
      where: (fields, { and, eq }) =>
        and(eq(fields.id, id), eq(fields.isActive, true)),
      with: {
        images: {
          orderBy: (images, { asc }) => [asc(images.displayOrder)],
        },
        variants: true,
        productCategories: {
          with: {
            category: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const { productCategories: pc, ...rest } = product;
    res.json({
      ...rest,
      categories: pc.map((p) => p.category),
    });
  },

  // ------------------------------------------------------------
  // Admin: create a new product (imageUrls already obtained from /api/upload)
  // NOTE: Using sequential DB calls instead of transactions because
  //       the Neon HTTP driver doesn't support transactions.
  // ------------------------------------------------------------
  create: async (req: Request, res: Response) => {
    try {
      const {
        name,
        description,
        price,
        stock,
        categoryIds,
        variantNames,
        imageUrls,
      } = req.body;

      // 1. Insert product
      const [newProduct] = await db
        .insert(products)
        .values({ name, description, price, stock, isActive: true })
        .returning();

      // 2. Batch insert images
      if (imageUrls && imageUrls.length > 0) {
        const imageValues = imageUrls.map((url: string, idx: number) => ({
          productId: newProduct.id,
          imageUrl: url,
          displayOrder: idx,
        }));
        await db.insert(productImages).values(imageValues);
      }

      // 3. Batch insert variants
      if (variantNames && variantNames.length > 0) {
        const variantValues = variantNames.map((vname: string) => ({
          productId: newProduct.id,
          name: vname,
        }));
        await db.insert(productVariants).values(variantValues);
      }

      // 4. Batch insert categories
      if (categoryIds && categoryIds.length > 0) {
        const categoryValues = categoryIds.map((catId: number) => ({
          productId: newProduct.id,
          categoryId: catId,
        }));
        await db.insert(productCategories).values(categoryValues);
      }

      // 5. Return the fully populated product
      const result = await db.query.products.findFirst({
        where: (fields, { eq }) => eq(fields.id, newProduct.id),
        with: {
          images: {
            orderBy: (images, { asc }) => [asc(images.displayOrder)],
          },
          variants: true,
          productCategories: { with: { category: true } },
        },
      });

      if (!result) {
        return res.status(500).json({ error: "Failed to create product" });
      }

      const { productCategories: pc, ...rest } = result;
      res.status(201).json({
        ...rest,
        categories: pc.map((p) => p.category),
      });
    } catch (error) {
      console.error("[createProduct] error:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: String(error) });
    }
  },

  // ------------------------------------------------------------
  // Admin: update a product (replaces variants & categories, appends new images)
  // NOTE: Using sequential DB calls instead of transactions because
  //       the Neon HTTP driver doesn't support transactions.
  // ------------------------------------------------------------
  update: async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id as string);
      const {
        name,
        description,
        price,
        stock,
        categoryIds,
        variantNames,
        imageUrls,
      } = req.body;

      // 1. Update basic product fields (only provided ones)
      const updateData: Partial<typeof products.$inferInsert> = {};
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = price;
      if (stock !== undefined) updateData.stock = stock;
      if (Object.keys(updateData).length > 0) {
        await db.update(products).set(updateData).where(eq(products.id, id));
      }

      // 2. Append new images (keep existing ones)
      if (imageUrls && imageUrls.length > 0) {
        const existingImages = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, id));
        const maxOrder = existingImages.length
          ? Math.max(...existingImages.map((img) => img.displayOrder || 0))
          : -1;
        const newImageValues = imageUrls.map((url: string, idx: number) => ({
          productId: id,
          imageUrl: url,
          displayOrder: maxOrder + idx + 1,
        }));
        await db.insert(productImages).values(newImageValues);
      }

      // 3. Replace variants (delete all, then batch insert)
      if (variantNames !== undefined) {
        await db
          .delete(productVariants)
          .where(eq(productVariants.productId, id));
        if (variantNames.length > 0) {
          const variantValues = variantNames.map((vname: string) => ({
            productId: id,
            name: vname,
          }));
          await db.insert(productVariants).values(variantValues);
        }
      }

      // 4. Replace categories
      if (categoryIds !== undefined) {
        await db
          .delete(productCategories)
          .where(eq(productCategories.productId, id));
        if (categoryIds.length > 0) {
          const categoryValues = categoryIds.map((catId: number) => ({
            productId: id,
            categoryId: catId,
          }));
          await db.insert(productCategories).values(categoryValues);
        }
      }

      res.json({ message: "Product updated successfully" });
    } catch (error) {
      console.error("[updateProduct] error:", error);
      res
        .status(500)
        .json({ error: "Internal server error", details: String(error) });
    }
  },

  // ------------------------------------------------------------
  // Admin: soft delete a product
  // ------------------------------------------------------------
  delete: async (req: Request, res: Response) => {
    const id = parseInt(req.params.id as string);
    const [deleted] = await db
      .update(products)
      .set({ isActive: false })
      .where(eq(products.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted (soft)" });
  },
};
