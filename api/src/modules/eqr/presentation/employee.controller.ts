import { Body, Controller, Get, Header, Param, Patch, Post, Query, Req } from "@nestjs/common"
import { AuthService, SESSION_COOKIE } from "../../iam/application/auth.service"
import { readCookie } from "../../iam/presentation/auth.controller"
import { EmployeeService } from "../application/employee.service"
type Request = { headers: { cookie?: string; origin?: string } }
@Controller("employees")
export class EmployeeController {
  constructor(private readonly employees: EmployeeService,private readonly auth: AuthService) {}
  private async identity(request: Request,write=false) {
    if(write) await this.auth.verifyRequestOrigin(request.headers.origin,"EMPLOYEE_WRITE")
    return this.auth.me(readCookie(request,SESSION_COOKIE))
  }
  @Get() @Header("Cache-Control","no-store") async list(@Req() r:Request,@Query() q:Record<string,unknown>) {return this.employees.list(await this.identity(r),q)}
  @Get("next-code") @Header("Cache-Control","no-store") async previewCode(@Req() r:Request,@Query() q:Record<string,unknown>) {return this.employees.previewCode(await this.identity(r),q.factoryId)}
  @Post("import") @Header("Cache-Control","no-store") async importEmployees(@Req() r:Request,@Body() b:Record<string,unknown>) {return this.employees.importEmployees(await this.identity(r,true),b??{})}
  @Get(":id") @Header("Cache-Control","no-store") async detail(@Req() r:Request,@Param("id") id:string) {return this.employees.detail(await this.identity(r),id)}
  @Post() async create(@Req() r:Request,@Body() b:Record<string,unknown>) {return this.employees.create(await this.identity(r,true),b??{})}
  @Patch(":id") async update(@Req() r:Request,@Param("id") id:string,@Body() b:Record<string,unknown>) {return this.employees.update(await this.identity(r,true),id,b??{})}
  @Post(":id/status") async status(@Req() r:Request,@Param("id") id:string,@Body() b:Record<string,unknown>) {return this.employees.status(await this.identity(r,true),id,b??{})}
  @Get(":id/assignments") @Header("Cache-Control","no-store") async assignments(@Req() r:Request,@Param("id") id:string) {return (await this.employees.detail(await this.identity(r),id)).assignments}
  @Post(":id/assignments") async assign(@Req() r:Request,@Param("id") id:string,@Body() b:Record<string,unknown>) {return this.employees.assign(await this.identity(r,true),id,b??{})}
  @Get(":id/access-grants") @Header("Cache-Control","no-store") async grants(@Req() r:Request,@Param("id") id:string) {return (await this.employees.detail(await this.identity(r),id)).accessGrants}
  @Post(":id/access-grants") async grant(@Req() r:Request,@Param("id") id:string,@Body() b:Record<string,unknown>) {return this.employees.grant(await this.identity(r,true),id,b??{})}
  @Post(":id/access-grants/:grantId/revoke") async revoke(@Req() r:Request,@Param("id") id:string,@Param("grantId") grantId:string,@Body() b:Record<string,unknown>) {return this.employees.revoke(await this.identity(r,true),id,grantId,b??{})}
}
