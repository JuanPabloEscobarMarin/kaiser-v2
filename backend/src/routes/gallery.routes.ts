import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.ts";
import { asyncHandler } from "../middlewares/async-handler.ts";
import { optionalAuth, requireAdmin } from "../middlewares/auth.middleware.ts";
import { idParamSchema, validate } from "../middlewares/validate.middleware.ts";

const router = Router();

const createSchema = z.object({
  slug: z.string().min(1).max(200),
  caption: z.string().max(200).nullable().optional(),
  order: z.coerce.number().int().min(0).optional().default(0),
  state: z.boolean().optional().default(true),
});
const updateSchema = createSchema.partial();

router.get(
  "/",
  asyncHandler(optionalAuth),
  asyncHandler(async (req, res) => {
    const isAdmin = req.auth?.role === "ADMIN";
    res.json(
      await prisma.galleryImage.findMany({
        where: isAdmin ? {} : { state: true },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      }),
    );
  }),
);

router.post(
  "/",
  asyncHandler(requireAdmin),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const data = await prisma.galleryImage.create({
      data: {
        slug: req.body.slug,
        caption: req.body.caption ?? null,
        order: req.body.order,
        state: req.body.state,
      },
    });
    res.status(201).json({ message: "Imagen agregada", data });
  }),
);

router.put(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const data = await prisma.galleryImage.update({
      where: { id: String(req.params.id) },
      data: req.body,
    });
    res.json({ message: "Imagen actualizada", data });
  }),
);

router.delete(
  "/:id",
  asyncHandler(requireAdmin),
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    await prisma.galleryImage.delete({ where: { id: String(req.params.id) } });
    res.json({ message: "Imagen eliminada", id: String(req.params.id) });
  }),
);

export default router;
