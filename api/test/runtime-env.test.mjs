import assert from 'node:assert/strict'
import test from 'node:test'
import { configureDatabaseEnvironment } from '../scripts/runtime-env.mjs'
test('environment config is mandatory and errors never reveal supplied secrets', () => {
  assert.throws(()=>configureDatabaseEnvironment({env:{}}), /DATABASE_URL is required/)
  assert.throws(()=>configureDatabaseEnvironment({env:{DATABASE_URL:'not-a-url-private'}}), error=>!error.message.includes('private'))
})
test('explicit environment URL and optional database name override are preserved', () => {
  const env={DATABASE_URL:'postgresql://user:password@db.example:5432/configured',DATABASE_NAME:'test db'}
  configureDatabaseEnvironment({env})
  const url=new URL(env.DATABASE_URL)
  assert.equal(url.hostname,'db.example'); assert.equal(url.password,'password'); assert.equal(url.pathname,'/test%20db')
})
