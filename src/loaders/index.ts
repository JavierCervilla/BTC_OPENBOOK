import type { Application } from "express";


import expressLoader from "./express.ts";
import indexerLoader from "./indexer.ts";

export default async ({ expressApp }: { expressApp: Application }) => {
  await expressLoader({ app: expressApp });
}