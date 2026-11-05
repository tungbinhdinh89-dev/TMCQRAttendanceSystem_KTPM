import type { MigrationInterface, QueryRunner } from "typeorm"

export class DemoIdentityForeignKeys1793765919419 implements MigrationInterface {
  name = "DemoIdentityForeignKeys1793765919419"

  public async up(queryRunner: QueryRunner): Promise<void> {
    const constraints = [
      ["fk_departments_factory", "departments", "factory_id", "factories", "id"],
      ["fk_teams_department", "teams", "department_id", "departments", "id"],
      ["fk_integration_endpoints_config", "integration_endpoints", "config_version_id", "config_versions", "id"],
      ["fk_gate_stations_factory", "gate_stations", "factory_id", "factories", "id"],
      ["fk_gate_stations_endpoint", "gate_stations", "integration_endpoint_id", "integration_endpoints", "id"],
      ["fk_gate_stations_config", "gate_stations", "config_version_id", "config_versions", "id"],
      ["fk_users_employee", "users", "employee_id", "employees", "id"],
      ["fk_user_role_assignments_user", "user_role_assignments", "user_id", "users", "id"],
      ["fk_user_role_assignments_role", "user_role_assignments", "role_id", "roles", "id"],
      ["fk_role_permissions_role", "role_permissions", "role_id", "roles", "id"],
      ["fk_role_permissions_permission", "role_permissions", "permission_id", "permissions", "id"],
      ["fk_employee_assignments_employee", "employee_assignments", "employee_id", "employees", "id"],
      ["fk_employee_assignments_factory", "employee_assignments", "factory_id", "factories", "id"],
      ["fk_employee_assignments_department", "employee_assignments", "department_id", "departments", "id"],
      ["fk_employee_assignments_team", "employee_assignments", "team_id", "teams", "id"],
      ["fk_access_grants_employee", "access_grants", "employee_id", "employees", "id"],
      ["fk_access_grants_factory", "access_grants", "factory_id", "factories", "id"],
      ["fk_station_credentials_station", "station_credentials", "station_id", "gate_stations", "id"],
    ] as const

    for (const [name, table, column, referencedTable, referencedColumn] of constraints) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "${name}" FOREIGN KEY ("${column}") REFERENCES "${referencedTable}" ("${referencedColumn}")`,
      )
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const constraints = [
      ["fk_station_credentials_station", "station_credentials"],
      ["fk_access_grants_factory", "access_grants"],
      ["fk_access_grants_employee", "access_grants"],
      ["fk_employee_assignments_team", "employee_assignments"],
      ["fk_employee_assignments_department", "employee_assignments"],
      ["fk_employee_assignments_factory", "employee_assignments"],
      ["fk_employee_assignments_employee", "employee_assignments"],
      ["fk_role_permissions_permission", "role_permissions"],
      ["fk_role_permissions_role", "role_permissions"],
      ["fk_user_role_assignments_role", "user_role_assignments"],
      ["fk_user_role_assignments_user", "user_role_assignments"],
      ["fk_users_employee", "users"],
      ["fk_gate_stations_config", "gate_stations"],
      ["fk_gate_stations_endpoint", "gate_stations"],
      ["fk_gate_stations_factory", "gate_stations"],
      ["fk_integration_endpoints_config", "integration_endpoints"],
      ["fk_teams_department", "teams"],
      ["fk_departments_factory", "departments"],
    ] as const

    for (const [name, table] of constraints) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT "${name}"`)
    }
  }
}
