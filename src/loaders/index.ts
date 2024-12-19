import type { Application } from "express";


import expressLoader from "./express.ts";

export default async ({ expressApp }: { expressApp: Application }) => {
  await expressLoader({ app: expressApp });
}