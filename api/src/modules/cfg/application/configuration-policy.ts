import { BadRequestException, ConflictException, ForbiddenException } from "@nestjs/common"
import type { SessionIdentity } from "../../iam/application/auth.service"
export type ConfigurationResource = "organization" | "station" | "integration"
/** Never borrow scope or permissions from another role assignment. */
export function configurationScope(identity:SessionIdentity,write=false,resource:ConfigurationResource="organization") {
 const roles=identity.roles.filter(r=>{
  if(r.code==="ADM") return r.permissions.includes("iam:manage")
  if(write||resource==="integration") return false
  return r.code==="SEC"||(resource==="organization"&&r.code==="HR")
 })
 const global=roles.some(r=>r.scopeType==="GLOBAL")
 const factoryIds=[...new Set(roles.filter(r=>r.scopeType==="FACTORY"&&r.factoryId).map(r=>r.factoryId!))]
 if(!global&&!factoryIds.length)throw new ForbiddenException("No configuration scope for this resource")
 return {global,factoryIds}
}
export function assertFactory(identity:SessionIdentity,factoryId:string|null,write=false) {
 const scope=configurationScope(identity,write)
 if(!scope.global&&(!factoryId||!scope.factoryIds.includes(factoryId)))throw new ForbiddenException("Factory outside assigned scope")
}
export function text(value:unknown,max=150):string {if(typeof value!=="string"||!value.trim()||value.length>max)throw new BadRequestException("Invalid text");return value.trim()}
export function uuid(value:unknown):string {const s=text(value,36);if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s))throw new BadRequestException("Invalid ID");return s}
export function version(row:{rowVersion:number},expected:unknown) {if(!Number.isSafeInteger(expected)||row.rowVersion!==expected)throw new ConflictException("Stale version; reload before saving")}
export function dbConflict(error:unknown):never {if((error as {code?:string}).code==="23505")throw new ConflictException("Code already exists");throw error}
