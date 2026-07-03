import { Request, Response } from "express";
import { db } from "../db/db";
import { categories, productCategories } from "../db/schema";
import { eq } from "drizzle-orm";

export const categoryController = {
  //Get all categories
  list: async (req: Request, res: Response) => {
    try {
      const allCategories = await db.select().from(categories);
      res.status(200).json(allCategories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  //Create a new category
  create: async (req: Request, res: Response) => {
    const { name } = req.body;
    try {
      const [newCategory] = await db
        .insert(categories)
        .values({ name })
        .returning();
      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  //Update a category
  update: async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
      const [updatedCategory] = await db
        .update(categories)
        .set({ name })
        .where(eq(categories.id, Number(id)))
        .returning();
      if (!updatedCategory) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.status(200).json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  //Delete a category
  delete: async (req: Request, res: Response) => {
    const { id } = req.params;
    const categoryId = Number(id);
    if (isNaN(categoryId)) {
      return res.status(400).json({ error: "Invalid category ID format" });
    }
    try {
      const [deletedCategory] = await db
        .delete(categories)
        .where(eq(categories.id, categoryId))
        .returning();
      if (!deletedCategory) {
        return res.status(404).json({ error: "Category not found" });
      }
      return res.status(200).json(deletedCategory);
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
