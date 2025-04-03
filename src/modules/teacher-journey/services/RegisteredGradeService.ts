import type { RegisteredGrade } from '@prisma/client'
import BaseService from '@/services/BaseService'
import type { RegisteredToSave } from '../types/types'

const table = 'registeredGrade' as const
export default class RegisteredGradeService extends BaseService<RegisteredGrade> {
  constructor() {
    super(table)
  }

  async getRegisteredGradesByEnrollmentId(enrollmentId: string) {
    const { data, error } = await this.client
      .from('registeredGrade')
      .select(`
        *,
        student:student (disability),
        classroom:classroom (name),
        stage:stage (name),
        discipline:discipline (name),
        registeredGradeByThematicUnit:registeredGradeByThematicUnit (
          thematicUnitId,
          grade,
          thematicUnit:thematicUnit (name)
        )
      `)
      .eq('enrollmentId', enrollmentId)

    if (error) {
      throw new Error(`Erro ao buscar notas registradas por matrícula: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma nota registrada encontrada')
    }

    return data
  }

  async createRegisteredGrade(registeredGrade: RegisteredToSave) {
    const { data, error } = await this.client
      .from('registeredGrade')
      .insert(registeredGrade)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar nota registrada: ${error.message}`)
    }
    if (!data) {
      throw new Error('Falha ao criar nota registrada')
    }

    return data
  }
}
