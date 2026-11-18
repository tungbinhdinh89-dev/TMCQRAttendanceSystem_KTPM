import test from "node:test"
import assert from "node:assert/strict"
import { configurationScope, assertFactory, version } from "../dist/modules/cfg/application/configuration-policy.js"
import { hashStationSecret, stationOnline } from "../dist/modules/gate/application/station-configuration.service.js"
const factory="00000000-0000-4000-8000-000000000001"
const identity=(roles)=>({roles})
test("configuration writes require ADM permission and scope on the same assignment",()=>{
 const user=identity([{code:"ADM",scopeType:"FACTORY",factoryId:factory,permissions:["iam:manage"]},{code:"HR",scopeType:"GLOBAL",permissions:[]}])
 assert.deepEqual(configurationScope(user,true),{global:false,factoryIds:[factory]})
 assert.throws(()=>assertFactory(user,"00000000-0000-4000-8000-000000000002",true),e=>e.getStatus()===403)
 assert.throws(()=>configurationScope(identity([{code:"ADM",scopeType:"GLOBAL",permissions:[]}]),true),e=>e.getStatus()===403)
})
test("HR organization reads are scoped and never grant writes",()=>{
 const user=identity([{code:"HR",scopeType:"FACTORY",factoryId:factory,permissions:[]}])
 assert.equal(configurationScope(user).factoryIds[0],factory)
 assert.throws(()=>configurationScope(user,true),e=>e.getStatus()===403)
})
test("configuration stale version is a conflict",()=>{
 assert.doesNotThrow(()=>version({rowVersion:2},2))
 assert.throws(()=>version({rowVersion:2},1),e=>e.getStatus()===409)
})
test("heartbeat freshness is not station physical state; credential hashing is stable",()=>{
 const now=Date.now()
 assert.equal(stationOnline(null,now),false)
 assert.equal(stationOnline(new Date(now-1000),now),true)
 assert.equal(stationOnline(new Date(now-86401000),now),false)
 assert.equal(stationOnline(new Date(now+1000),now),false)
 assert.equal(hashStationSecret("fixture"),hashStationSecret("fixture"))
 assert.notEqual(hashStationSecret("fixture"),"fixture")
})
