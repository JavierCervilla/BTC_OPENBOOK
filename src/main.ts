import express from "express";
import loaders from "./loaders/index.ts";
import logger from "@/utils/logger.ts";
import { CONFIG } from "@/config/index.ts";
import indexerLoader from "@/loaders/indexer.ts";


async function startServer() {
    const app = express();
    
    await loaders({ expressApp: app });
    app.listen(CONFIG.API.PORT, (err: unknown) => {
        if (err) {
            logger.critical(err);
            return;
        }
        console.log(`🌟Your server is ready and listening on http://localhost:${CONFIG.API.PORT}`);
    });
    Deno.env.get("NODE_ENV") !== "development" && await indexerLoader();
  }
  
  startServer();