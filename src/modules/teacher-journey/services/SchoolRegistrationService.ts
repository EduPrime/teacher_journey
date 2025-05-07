import type { School } from '@prisma/client'
import BaseService from '@/services/BaseService'
import errorHandler from '@/utils/error-handler'

interface SchoolRegistrationData {
  id?: string
  name: string
  institutionId: string
  idpes?: number | null
  INEPCode?: string | null
  corporateName?: string | null
  acronym?: string | null
  blockJournalEntries?: boolean | null
  operationalStatus?: boolean | null
  usesAlternativeRules?: boolean | null
  educationNetwork?: boolean | null
  administrativeDependency?: string | null
  cnpj?: number | null
  address?: string | null
  addressNumber?: string | null
  additionalInfo?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  postalCode?: string | null
  unusualLocation?: boolean | null
  phone?: string | null
  phone2?: string | null
  email?: string | null
  website?: string | null
  operatingLocation?: string | null
  buildingUsage?: string | null
  sharedSchool?: boolean | null
  sharedSchoolINEPCode?: string | null
  potableWaterAvailable?: boolean | null
  sewageAvailable?: boolean | null
  electricityAvailable?: boolean | null
  wasteDisposal?: string | null
  wasteTreatmentBySchool?: boolean | null
  foodServiceAvailable?: boolean | null
  communitySharedSpaces?: boolean | null
  usesSurroundingSpaces?: boolean | null
  specificFacilities?: boolean | null
  insideClassroooms?: number | null
  outsideClassrooms?: number | null
  refrigeratedClassrooms?: number | null
  accessibleClassrooms?: number | null
  internetAvailable?: boolean | null
  localNetworkAvailable?: boolean | null
  connectionTypes?: string | null
  devicesUsedByStudents?: string[] | null
  availabeDesktops?: number | null
  availableLaptops?: number | null
  availableTablets?: number | null
  teachingEquipments?: string[] | null
  administrativeStaffNumber?: number | null
  teachingStaffNumber?: number | null
  generalServicesStaffNumber?: number | null
  securityStaffNumber?: number | null
  schoolManagementStaffNumber?: number | null
  healthcareStaffNumber?: number | null
  socialAssistanceStaffNumber?: number | null
  specializedAssistance?: boolean | null
  elementaryEducationModel?: string | null
  pedagogicalMaterials?: string[] | null
  collegiateBodies?: string[] | null
  studentSelectionCriteria?: string[] | null
  wasPedagogicalProjectUpdated?: boolean | null
  indigenousEducationAvailable?: boolean | null
  indigenousEducationLanguages?: string[] | null
  linkedWithSuperiorEducation?: boolean | null
  headSchoolCode?: string | null
  IESCode?: string | null
  active?: boolean | null
  abbreviation?: string | null
  longitude?: string | null
  latitude?: string | null
  totalArea?: string | null
  builtArea?: string | null
  availableArea?: string | null
  blockDiaryEntries?: boolean | null
  regulation?: number | null
  logoUrl?: string | null
  access?: number | null
  managerid?: string | null
  managerPosition?: string | null
  operationLocation?: string | null
  condition?: number | null
  sharedSchooLinePCode?: number | null
  creationDecree?: string | null
  numberOfFloors?: number | null
  floorType?: number | null
  energyMeter?: number | null
  hasExternalArea?: boolean | null
  metadata?: any | null
  updatedBy?: string | null
  tenantId?: string | null
  userCreated?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  deletedAt?: string | null
}

const table = 'school' as const

export default class SchoolRegistrationService extends BaseService<School> {

  constructor() {
    super(table)
  }

  async getSchoolRegistrationById(id: string): Promise<School | null> {

    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq('id', id)
      .is('deletedAt', null)
      .single()

    if (error) {
      errorHandler(error, 'Erro ao buscar escola')
    }

    return data
  }

  async getSchoolRegistrations(institutionId: string): Promise<School[]> {

    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq('institutionId', institutionId)
      .is('deletedAt', null)
      .order('name', { ascending: true })

    if (error) {
      errorHandler(error, 'Erro ao buscar escolas')
    }

    return data || []
  }

  async schoolExistsByName(name: string, institutionId: string, exceptId?: string): Promise<boolean> {

    let query = this.client
      .from(table)
      .select('id')
      .eq('name', name)
      .eq('institutionId', institutionId)
      .is('deletedAt', null)

    if (exceptId) {
      query = query.neq('id', exceptId)
    }

    const { data, error } = await query

    if (error) {
      errorHandler(error, 'Erro ao verificar existência de escola')
    }

    return !!(data && data.length > 0)
  }

  async schoolExistsByINEPCode(inepCode: string, exceptId?: string): Promise<boolean> {
    if (!inepCode) return false

    let query = this.client
      .from(table)
      .select('id')
      .eq('INEPCode', inepCode)
      .is('deletedAt', null)

    if (exceptId) {
      query = query.neq('id', exceptId)
    }

    const { data, error } = await query

    if (error) {
      errorHandler(error, 'Erro ao verificar existência de escola pelo código INEP')
    }

    return !!(data && data.length > 0)
  }

  async upsertSchoolRegistration(schoolData: SchoolRegistrationData): Promise<School> {
    const now = new Date().toISOString()

    if (!schoolData.id || (schoolData.id && await this.getSchoolRegistrationById(schoolData.id))) {
      const nameExists = await this.schoolExistsByName(
        schoolData.name,
        schoolData.institutionId,
        schoolData.id
      )

      if (nameExists) {
        errorHandler(new Error('CONFLICT'), 'Já existe uma escola com este nome na instituição')
        throw new Error('Já existe uma escola com este nome na instituição')
      }

      if (schoolData.INEPCode) {
        const inepExists = await this.schoolExistsByINEPCode(schoolData.INEPCode, schoolData.id)
        if (inepExists) {
          errorHandler(new Error('CONFLICT'), 'Já existe uma escola com este código INEP')
          throw new Error('Já existe uma escola com este código INEP')
        }
      }
    }

    const payload: SchoolRegistrationData = {
      ...schoolData,
      updatedAt: now,
      ...(schoolData.id ? {} : { createdAt: now })
    }

    const { data, error } = await this.client
      .from(table)
      .upsert(payload, { onConflict: schoolData.id ? 'id' : undefined })
      .select()
      .single()

    if (error) {
      errorHandler(error, 'Erro ao salvar registro de escola')
      throw new Error('Erro ao salvar registro de escola')
    }

    return data as School
  }

  async softDeleteSchoolRegistration(id: string, userId: string): Promise<boolean> {

    const now = new Date().toISOString()

    const { data, error } = await this.client
      .from(table)
      .update({
        deletedAt: now,
        updatedAt: now,
        updatedBy: userId,
        active: false
      })
      .eq('id', id)

    if (error) {
      errorHandler(error, 'Erro ao excluir escola')
      return false
    }

    return true
  }
}
