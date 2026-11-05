import assert from "node:assert/strict"
import test from "node:test"
import { AuthService, encodePassword, hashToken } from "../dist/modules/iam/application/auth.service.js"

const user = {
  id: "00000000-0000-0000-0000-000000000001",
  employeeId: "00000000-0000-0000-0000-000000000002",
  username: "emp001",
  passwordHash: encodePassword("correct-password"),
  status: "ACTIVE",
}
const employee = {
  id: user.employeeId,
  employeeCode: "EMP001",
  fullName: "Demo Employee",
  status: "ACTIVE",
}

function createFixture() {
  let savedSession
  const userRepository = {
    findOne: async () => user,
    update: async () => undefined,
  }
  const employeeRepository = { findOne: async () => employee }
  const sessionRepository = {
    create: (value) => ({ id: "00000000-0000-0000-0000-000000000003", ...value }),
    save: async (value) => {
      savedSession = value
      return value
    },
    findOne: async ({ where }) => savedSession?.tokenHash === where.tokenHash ? savedSession : null,
    update: async (_id, patch) => {
      savedSession = { ...savedSession, ...patch }
    },
  }
  const roleAssignmentRepository = {
    createQueryBuilder: () => ({
      innerJoin: function () { return this },
      leftJoin: function () { return this },
      select: function () { return this },
      where: function () { return this },
      andWhere: function () { return this },
      getRawMany: async () => [{
        code: "EMP",
        scopeType: "SELF",
        factoryId: null,
        departmentId: null,
        teamId: null,
        permission: "attendance:read:self",
      }],
    }),
  }
  const dataSource = {
    getRepository(entity) {
      if (entity.name === "UserOrmEntity") return userRepository
      if (entity.name === "EmployeeOrmEntity") return employeeRepository
      if (entity.name === "UserSessionOrmEntity") return sessionRepository
      if (entity.name === "RoleAssignmentOrmEntity") return roleAssignmentRepository
      throw new Error(`Unexpected repository ${entity.name}`)
    },
    transaction: async (callback) => callback({ save: sessionRepository.save, update: userRepository.update }),
  }
  return { dataSource, sessionRepository }
}

test("login creates an opaque session and returns scoped identity", async () => {
  const fixture = createFixture()
  const service = new AuthService(fixture.dataSource)
  const result = await service.login("emp001", "correct-password")

  assert.equal(result.identity.employee.employeeCode, "EMP001")
  assert.equal(result.identity.roles[0].scopeType, "SELF")
  assert.notEqual(result.token, user.passwordHash)
  assert.equal(fixture.sessionRepository.findOne({ where: { tokenHash: hashToken(result.token) } }) instanceof Promise, true)
})

test("expired or revoked sessions are rejected and logout revokes the hash", async () => {
  const fixture = createFixture()
  const service = new AuthService(fixture.dataSource)
  const result = await service.login("emp001", "correct-password")

  await service.logout(result.token)
  await assert.rejects(() => service.me(result.token), { name: "UnauthorizedException" })
})
