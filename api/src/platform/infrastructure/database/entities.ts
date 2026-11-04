import { AttendanceCorrectionOrmEntity } from "../../../modules/att/infrastructure/persistence/entities/attendance-correction.orm-entity"
import { AttendanceEventRevisionOrmEntity } from "../../../modules/att/infrastructure/persistence/entities/attendance-event-revision.orm-entity"
import { AttendanceEventOrmEntity } from "../../../modules/att/infrastructure/persistence/entities/attendance-event.orm-entity"
import { AttendanceReviewRequestOrmEntity } from "../../../modules/att/infrastructure/persistence/entities/attendance-review-request.orm-entity"
import { PresenceIntervalOrmEntity } from "../../../modules/att/infrastructure/persistence/entities/presence-interval.orm-entity"
import { ConfigVersionOrmEntity } from "../../../modules/cfg/infrastructure/persistence/entities/config-version.orm-entity"
import { DepartmentOrmEntity } from "../../../modules/cfg/infrastructure/persistence/entities/department.orm-entity"
import { FactoryOrmEntity } from "../../../modules/cfg/infrastructure/persistence/entities/factory.orm-entity"
import { IntegrationEndpointOrmEntity } from "../../../modules/cfg/infrastructure/persistence/entities/integration-endpoint.orm-entity"
import { TeamOrmEntity } from "../../../modules/cfg/infrastructure/persistence/entities/team.orm-entity"
import { AccessAttemptOrmEntity } from "../../../modules/gate/infrastructure/persistence/entities/access-attempt.orm-entity"
import { GateCommandHistoryOrmEntity } from "../../../modules/gate/infrastructure/persistence/entities/gate-command-history.orm-entity"
import { GateCommandOrmEntity } from "../../../modules/gate/infrastructure/persistence/entities/gate-command.orm-entity"
import { GateDeviceEventOrmEntity } from "../../../modules/gate/infrastructure/persistence/entities/gate-device-event.orm-entity"
import { GateStationOrmEntity } from "../../../modules/gate/infrastructure/persistence/entities/gate-station.orm-entity"
import { ReconciliationCaseOrmEntity } from "../../../modules/gate/infrastructure/persistence/entities/reconciliation-case.orm-entity"
import { StationCredentialOrmEntity } from "../../../modules/gate/infrastructure/persistence/entities/station-credential.orm-entity"
import { AuditEntryOrmEntity } from "../../../modules/iam/infrastructure/persistence/entities/audit-entry.orm-entity"
import { PermissionOrmEntity } from "../../../modules/iam/infrastructure/persistence/entities/permission.orm-entity"
import { RoleAssignmentOrmEntity } from "../../../modules/iam/infrastructure/persistence/entities/role-assignment.orm-entity"
import { RolePermissionOrmEntity } from "../../../modules/iam/infrastructure/persistence/entities/role-permission.orm-entity"
import { RoleOrmEntity } from "../../../modules/iam/infrastructure/persistence/entities/role.orm-entity"
import { UserOrmEntity } from "../../../modules/iam/infrastructure/persistence/entities/user.orm-entity"
import { UserSessionOrmEntity } from "../../../modules/iam/infrastructure/persistence/entities/user-session.orm-entity"
import { AccessGrantOrmEntity } from "../../../modules/eqr/infrastructure/persistence/entities/access-grant.orm-entity"
import { EmployeeAssignmentOrmEntity } from "../../../modules/eqr/infrastructure/persistence/entities/employee-assignment.orm-entity"
import { EmployeeOrmEntity } from "../../../modules/eqr/infrastructure/persistence/entities/employee.orm-entity"
import { QrCredentialOrmEntity } from "../../../modules/eqr/infrastructure/persistence/entities/qr-credential.orm-entity"
import { QrRedemptionOrmEntity } from "../../../modules/eqr/infrastructure/persistence/entities/qr-redemption.orm-entity"
import { QrSigningKeyOrmEntity } from "../../../modules/eqr/infrastructure/persistence/entities/qr-signing-key.orm-entity"
import { QrTokenOrmEntity } from "../../../modules/eqr/infrastructure/persistence/entities/qr-token.orm-entity"
import { BackgroundJobOrmEntity } from "../../../modules/rpt/infrastructure/persistence/entities/background-job.orm-entity"
import { ExportAttemptOrmEntity } from "../../../modules/rpt/infrastructure/persistence/entities/export-attempt.orm-entity"
import { ExportBatchOrmEntity } from "../../../modules/rpt/infrastructure/persistence/entities/export-batch.orm-entity"
import { ExportItemSourceOrmEntity } from "../../../modules/rpt/infrastructure/persistence/entities/export-item-source.orm-entity"
import { ExportItemOrmEntity } from "../../../modules/rpt/infrastructure/persistence/entities/export-item.orm-entity"
import { OutboxMessageOrmEntity } from "../../../modules/rpt/infrastructure/persistence/entities/outbox-message.orm-entity"

export const databaseEntities = [
  FactoryOrmEntity,
  DepartmentOrmEntity,
  TeamOrmEntity,
  ConfigVersionOrmEntity,
  IntegrationEndpointOrmEntity,
  UserOrmEntity,
  RoleOrmEntity,
  PermissionOrmEntity,
  RolePermissionOrmEntity,
  RoleAssignmentOrmEntity,
  UserSessionOrmEntity,
  AuditEntryOrmEntity,
  EmployeeOrmEntity,
  EmployeeAssignmentOrmEntity,
  AccessGrantOrmEntity,
  QrSigningKeyOrmEntity,
  QrCredentialOrmEntity,
  QrTokenOrmEntity,
  QrRedemptionOrmEntity,
  GateStationOrmEntity,
  StationCredentialOrmEntity,
  AccessAttemptOrmEntity,
  GateCommandOrmEntity,
  GateCommandHistoryOrmEntity,
  GateDeviceEventOrmEntity,
  ReconciliationCaseOrmEntity,
  AttendanceEventOrmEntity,
  AttendanceEventRevisionOrmEntity,
  AttendanceCorrectionOrmEntity,
  PresenceIntervalOrmEntity,
  AttendanceReviewRequestOrmEntity,
  ExportBatchOrmEntity,
  ExportItemOrmEntity,
  ExportItemSourceOrmEntity,
  ExportAttemptOrmEntity,
  OutboxMessageOrmEntity,
  BackgroundJobOrmEntity,
]
