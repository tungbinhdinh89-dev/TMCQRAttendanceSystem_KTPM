import { NestFactory } from "@nestjs/core"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.setGlobalPrefix("api")
  const origins = (process.env.CORS_ORIGINS || "http://localhost:5173").split(",").map(value => value.trim()).filter(Boolean)
  app.enableCors({ origin: origins, credentials: true })
  if (process.env.API_DOCS_ENABLED !== "false") {
    const config = new DocumentBuilder().setTitle("TMC Access API").setVersion("1.0")
      .setDescription("API đang triển khai. Đăng nhập qua auth/login để nhận cookie HttpOnly; Swagger cùng origin sẽ gửi cookie khi Try it out.")
      .addCookieAuth("tmc_session", { type: "apiKey", in: "cookie" }, "session").build()
    SwaggerModule.setup("api/docs", app, SwaggerModule.createDocument(app, config), {
      jsonDocumentUrl: "api/openapi.json", swaggerOptions: { withCredentials: true },
    })
  }
  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
