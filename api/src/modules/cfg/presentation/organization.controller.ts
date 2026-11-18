import { Body,Controller,Get,Header,Param,Patch,Post,Req } from "@nestjs/common"
import { AuthService,SESSION_COOKIE } from "../../iam/application/auth.service"
import { readCookie } from "../../iam/presentation/auth.controller"
import { OrganizationService } from "../application/organization.service"
@Controller("organization")
export class OrganizationController {
 constructor(private readonly service:OrganizationService,private readonly auth:AuthService){}
 @Get() @Header("Cache-Control","no-store") async lookup(@Req() req:any){return this.service.lookup(await this.auth.me(readCookie(req,SESSION_COOKIE)))}
 @Post(":kind") async create(@Req() req:any,@Param("kind") kind:string,@Body() body:Record<string,unknown>){await this.auth.verifyRequestOrigin(req.headers.origin,"ORGANIZATION_SAVE");return this.service.save(await this.auth.me(readCookie(req,SESSION_COOKIE)),kind,body)}
 @Patch(":kind/:id") async update(@Req() req:any,@Param("kind") kind:string,@Param("id") id:string,@Body() body:Record<string,unknown>){await this.auth.verifyRequestOrigin(req.headers.origin,"ORGANIZATION_SAVE");return this.service.save(await this.auth.me(readCookie(req,SESSION_COOKIE)),kind,body,id)}
}
