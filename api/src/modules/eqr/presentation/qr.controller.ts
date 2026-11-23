import { BadRequestException, Body, Controller, Get, Header, Param, Post, Req } from "@nestjs/common"
import { AuthService, SESSION_COOKIE } from "../../iam/application/auth.service"
import { readCookie } from "../../iam/presentation/auth.controller"
import { QrService } from "../application/qr.service"
type Request={headers:{cookie?:string;origin?:string}}
@Controller()
export class QrController {
  constructor(private readonly service:QrService,private readonly auth:AuthService){}
  private async identity(req:Request,write=false){if(write)await this.auth.verifyRequestOrigin(req.headers.origin,"QR_WRITE");return this.auth.me(readCookie(req,SESSION_COOKIE))}
  @Get("qr/self") @Header("Cache-Control","no-store") async status(@Req() req:Request){return this.service.status(await this.identity(req))}
  @Post("qr/self/token") @Header("Cache-Control","no-store") async issue(@Req() req:Request,@Body() input:Record<string,unknown>){
    if(input&&Object.keys(input).length)throw new BadRequestException("Self QR accepts no employee selector")
    return this.service.issue(await this.identity(req,true))
  }
  @Post("employees/:id/qr-credential") @Header("Cache-Control","no-store") async provision(@Req() req:Request,@Param("id") id:string,@Body() input:Record<string,unknown>){return this.service.provision(await this.identity(req,true),id,input??{})}
  @Post("employees/:id/qr-credential/revoke") @Header("Cache-Control","no-store") async revoke(@Req() req:Request,@Param("id") id:string,@Body() input:Record<string,unknown>){return this.service.revoke(await this.identity(req,true),id,input??{})}
}
