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
                <html>
                <head>
                    <title>Documentación de la API</title>
                    <link rel="icon" href="https://firemints.xyz/fire.svg" />
                    <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
                </head>
                <body>
                    <!-- Componente RapiDoc -->
                    <rapi-doc
                        spec-url="/openapi.json"
                        render-style="interactive"
                        show-header="true"
                        show-info="true"
                        show-component-summary="true"
                        expand-responses="200,201"
                        theme='{
                            "colors": {
                                "primary": {
                                    "main": "#2c3e50"
                                },
                                "background": {
                                    "main": "#ffffff"
                                }
                            }
                        }'
                    >
                        <img
                            slot="logo"
                            src="https://firemints.xyz/fire.svg"
                        />
                        <img
                            slot="nav-logo"
                            src="https://firemints.xyz/logo.svg"
                        />
                    </rapi-doc>
                </body>
                </html>
            `);
        });

    }
}