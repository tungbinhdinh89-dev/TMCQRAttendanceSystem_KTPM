import {Body,Controller,Delete,Get,Header,Param,Patch,Post,Req} from "@nestjs/common"
import {AuthService,SESSION_COOKIE} from "../../iam/application/auth.service"
import {readCookie} from "../../iam/presentation/auth.controller"
import {StationConfigurationService} from "../application/station-configuration.service"
@Controller("configuration")
export class StationConfigurationController{
 constructor(private readonly service:StationConfigurationService,private readonly auth:AuthService){}
 private async who(req:any,write=false){if(write)await this.auth.verifyRequestOrigin(req.headers.origin,"CONFIGURATION_SAVE");return this.auth.me(readCookie(req,SESSION_COOKIE))}
 @Get("stations") @Header("Cache-Control","no-store") async stations(@Req() req:any){return this.service.stations(await this.who(req))}
 @Post("stations") async createStation(@Req() req:any,@Body() body:Record<string,unknown>){return this.service.saveStation(await this.who(req,true),body)}
 @Patch("stations/:id") async updateStation(@Req() req:any,@Param("id") id:string,@Body() body:Record<string,unknown>){return this.service.saveStation(await this.who(req,true),body,id)}
 @Post("stations/:id/credentials") @Header("Cache-Control","no-store") async provision(@Req() req:any,@Param("id") id:string,@Body() body:Record<string,unknown>){return this.service.credential(await this.who(req,true),id,body??{})}
 @Delete("stations/:id/credentials/:credentialId") async revoke(@Req() req:any,@Param("id") id:string,@Param("credentialId") cid:string,@Body() body:Record<string,unknown>){return this.service.credential(await this.who(req,true),id,body??{},cid)}
 @Get("integrations") @Header("Cache-Control","no-store") async integrations(@Req() req:any){return this.service.integrations(await this.who(req))}
 @Post("integrations") async createIntegration(@Req() req:any,@Body() body:Record<string,unknown>){return this.service.saveIntegration(await this.who(req,true),body)}
 @Patch("integrations/:id") async updateIntegration(@Req() req:any,@Param("id") id:string,@Body() body:Record<string,unknown>){return this.service.saveIntegration(await this.who(req,true),body,id)}
 @Get("readiness") @Header("Cache-Control","no-store") async readiness(@Req() req:any){return this.service.readiness(await this.who(req))}
}
@Controller("stations")
export class StationHeartbeatController{
 constructor(private readonly service:StationConfigurationService){}
 @Post(":id/heartbeat") @Header("Cache-Control","no-store") async heartbeat(@Req() req:any,@Param("id") id:string,@Body() body:Record<string,unknown>){return this.service.heartbeat(id,req.headers.authorization,body??{})}
}
