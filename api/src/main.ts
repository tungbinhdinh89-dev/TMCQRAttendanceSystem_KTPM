import { NestFactory } from "@nestjs/core"
import { allowedOrigins } from "./platform/http/allowed-origins"
import { AppModule } from "./app.module"
import { ApiExceptionFilter } from "./platform/http/api-exception.filter"
import { configureApiDocumentation } from "./platform/http/openapi"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false })
  // Limit the larger JSON envelope to the bounded employee import route only.
  const { json, urlencoded } = require("express")
  app.use("/api/employees/import", json({ limit: "2mb" }))
  app.use(json({ limit: "100kb" }))
  app.use(urlencoded({ extended: true, limit: "100kb" }))
  app.setGlobalPrefix("api")
  app.useGlobalFilters(new ApiExceptionFilter())
  app.enableCors({ origin: allowedOrigins(), credentials: true })
  configureApiDocumentation(app)
  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
