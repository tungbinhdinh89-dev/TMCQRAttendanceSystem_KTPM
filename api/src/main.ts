import { NestFactory } from "@nestjs/core"
import { allowedOrigins } from "./platform/http/allowed-origins"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix("api")
  app.enableCors({ origin: allowedOrigins(), credentials: true })
  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()