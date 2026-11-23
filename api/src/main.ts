import { NestFactory } from "@nestjs/core"
import { allowedOrigins } from "./platform/http/allowed-origins"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false })
  // Limit the larger JSON envelope to the bounded employee import route only.
  const { json, urlencoded } = require("express")
  app.use("/api/employees/import", json({ limit: "2mb" }))
  app.use(json({ limit: "100kb" }))
  app.use(urlencoded({ extended: true, limit: "100kb" }))
  app.setGlobalPrefix("api")
  app.enableCors({ origin: allowedOrigins(), credentials: true })
  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
