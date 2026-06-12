import { app } from "./app.ts";
import { env } from "./config/env.ts";

const port = Number(env.PORT);

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📦 Environment: ${env.NODE_ENV}`);
});
