import { Controller, Get, Header } from "@nestjs/common"

/** Public presentation data only. Business data is available exclusively through scoped APIs. */
@Controller("demo")
export class DemoBootstrapController {
  @Get("bootstrap")
  @Header("Cache-Control", "no-store")
  bootstrap() {
    return {
      data: {
        version: 1,
        employees: [], accounts: [], shifts: [], attendance: [], events: [],
        adjustments: [], notifications: [], gates: [], accessGrants: [],
      },
      traceId: crypto.randomUUID(),
    }
  }
}
