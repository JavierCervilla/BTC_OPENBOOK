import { TspecDocsMiddleware } from "tspec";
import type { Express } from "express";
import type { Request, Response } from "express";
export async function docsLoader(app: Express) {
    if (Deno.env.get("NODE_ENV") !== 'production') {
        app.use(await TspecDocsMiddleware());
    } else {
        app.get('/openapi.json', (_req: Request, res: Response) => {
            res.sendFile('generate/openapi.json', { root: './' });
        });
        app.get('/docs', (_req: Request, res: Response) => {
            res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Documentación API</title>
                <script src="https://unpkg.com/@stoplight/elements/web-components.min.js"></script>
                <link rel="stylesheet" href="https://unpkg.com/@stoplight/elements/styles.min.css">
            </head>
            <body>
                <elements-api
                    apiDescriptionUrl="/openapi.json"
                    router="hash"
                ></elements-api>
            </body>
            </html>
            `)
        });

    }
}