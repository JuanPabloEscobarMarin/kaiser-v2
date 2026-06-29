// Punto de entrada serverless para Vercel.
//
// Vercel transpila SOLO este archivo y no incluye el resto de `src/` (los
// imports con extensión `.ts` no se resuelven en runtime sin strip-types). Por
// eso el build (ver vercel.json → buildCommand) hace un bundle de toda la app
// con esbuild hacia `dist/app.js` (deps de node_modules externas), y aquí solo
// importamos ese bundle ya resuelto.
//
// Express ya es un handler `(req, res)`, así que exportamos la app tal cual.
// dist/app.js es el bundle generado por esbuild en el build (no existe en dev),
// por eso no tiene tipos. Lo ignoramos: el runtime es el que importa.
// @ts-ignore
import { app } from "../dist/app.js";

export default app;
