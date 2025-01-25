import { NextFunction, Request, Response, Router } from "express";
export const controller = {
  dailySummaryCart: (req: Request, res: Response, next: NextFunction) => {
    try {
      res.setHeader("Content-Type", "text/html");
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <link rel="stylesheet" href="/static/charts/counterparty.css">
            <title>SRCPad Analytics</title>
            <!-- React y ReactDOM desde CDN -->
            <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <!-- lightweight-charts desde CDN -->
            <script src="https://unpkg.com/lightweight-charts/dist/lightweight-charts.standalone.production.js"></script>
          </head>
          <body>
            <div id="root"></div>
            <!-- Tu script de componente -->
            <script type="module" src="/static/charts/counterparty.js"></script>
          </body>
        </html>
      `);
    } catch (error) {
      console.error("Error en dailySummaryCart:", error);
      next(error);
    }
  }
}

export function configureChartRoutes(router: Router) {
  router.get("/summary", controller.dailySummaryCart);
  return router;
}
