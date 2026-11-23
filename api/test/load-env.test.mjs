import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdtempSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

const loader = new URL("../scripts/load-env.mjs", import.meta.url).href
function load(t, override) {
  const cwd = mkdtempSync(join(tmpdir(), "tmc-loader-"))
  t.after(() => rmSync(cwd, {recursive:true,force:true}))
  const env = {...process.env, DATABASE_URL:"postgresql://fixture.invalid/original", TMC_DATABASE_OVERRIDE:override || ""}
  const result = spawnSync(process.execPath,["--import",loader,"--input-type=module","-e",'console.log(new URL(process.env.DATABASE_URL).pathname)'],{cwd,env,encoding:"utf8"})
  assert.equal(result.status,0,result.stderr)
  return result.stdout.trim()
}
test("shared env loader works outside api cwd and preserves explicit database URL", t => {
  assert.equal(load(t),"/original")
})
test("database override is explicit, per process and encodes the database name", t => {
  assert.equal(load(t,"other test"),"/other%20test")
})
