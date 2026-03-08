import { define } from "../utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html data-theme="light">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>boardgame-fresh-rebuild</title>
      </head>
      <body class="min-h-screen bg-base-200 text-base-content">
        <Component />
      </body>
    </html>
  );
});
