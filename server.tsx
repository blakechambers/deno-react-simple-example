import { Application, React, ReactDOMServer, Router } from "./dep.ts";

const app = new Application();
const router = new Router();
const browserBundlePath = "/browser.js";

import App from "./App.tsx";

const html = `<html>
    <head>
      <script type="module" src="${browserBundlePath}"></script>
      <style>* { font-family: Helvetica; }</style>
    </head>
    <body>${
  (ReactDOMServer as any).renderToString(
    <App />,
  )
}
    </body>
  </html>`;

const { files } = await Deno.emit("./client.tsx", {
  bundle: "esm",
  importMapPath: "./import_map.json",
});

const clientJS = files["deno:///bundle.js"];

router.get(browserBundlePath, (ctx: any) => {
  ctx.response.headers.set("Content-Type", "application/javascript");
  ctx.response.body = clientJS;
});

// // serve a simple HTML page containing our rendered app
router.get("/", (ctx: any) => {
  ctx.response.headers.set("Content-Type", "text/html");
  ctx.response.body = html;
});

// Logger
app.use(async (ctx: any, next: any) => {
  await next();
  const rt = ctx.response.headers.get("X-Response-Time");
  console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
});

// Timing
app.use(async (ctx: any, next: any) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  ctx.response.headers.set("X-Response-Time", `${ms}ms`);
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen({ port: 8000 });
