import { NestFactory } from "@nestjs/core"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix("api")
  const origins = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",").map(value => value.trim()).filter(Boolean)
  app.enableCors({ origin: origins, credentials: true })
  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
