export interface FactoryRecord { id:string;code:string;name:string;timezone:string;status:string;rowVersion:number }
export interface DepartmentRecord { id:string;factoryId:string;code:string;name:string;isActive:boolean;rowVersion:number }
export interface TeamRecord { id:string;departmentId:string;code:string;name:string;isActive:boolean;rowVersion:number }
export interface OrganizationLookup { factories:FactoryRecord[];departments:DepartmentRecord[];teams:TeamRecord[] }
