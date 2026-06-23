import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3333);
const app = createApp();

app.listen(port, () => {
  console.log(`JunkBox API listening on http://localhost:${port}`);
  console.log(`Swagger UI available on http://localhost:${port}/docs`);
});
