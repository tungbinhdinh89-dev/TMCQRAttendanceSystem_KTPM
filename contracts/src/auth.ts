export interface EmployeeAccountSummary { userId: string; username: string; status: string; mustChangePassword: boolean }
export interface ProvisionEmployeeAccountRequest { username: string }
/** Secret is returned only in the successful provisioning response; never persist client-side. */
export interface ProvisionEmployeeAccountResult { userId: string; username: string; temporaryPassword: string }
export interface ChangePasswordRequest { currentPassword: string; newPassword: string }
