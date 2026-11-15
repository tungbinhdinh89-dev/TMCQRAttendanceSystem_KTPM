import assert from 'node:assert/strict'
import test from 'node:test'
import { Test } from '@nestjs/testing'
import { DataSource } from 'typeorm'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from '../dist/app.module.js'
test('OpenAPI documents real routes, login request and cookie authentication', async()=>{
 const module=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(DataSource).useValue({query:async()=>[]}).compile()
 const app=module.createNestApplication();app.setGlobalPrefix('api')
 try {
  await app.init()
  const doc=SwaggerModule.createDocument(app,new DocumentBuilder().addCookieAuth('tmc_session',{type:'apiKey',in:'cookie'},'session').build())
  for(const path of ['/api/auth/login','/api/auth/logout','/api/me','/api/workspace/bootstrap'])assert.ok(doc.paths[path],path)
  assert.ok(doc.paths['/api/auth/login'].post.requestBody)
  assert.deepEqual(doc.paths['/api/me'].get.security,[{session:[]}])
  assert.ok(!doc.paths['/api/demo/bootstrap'])
 } finally {await app.close()}
})
