import type { RegisteredGrade } from '@prisma/client'
import BaseService from '@/services/BaseService'
import type { RegisteredToSave } from '../types/types'

const table = 'registeredGrade' as const
export default class RegisteredGradeService extends BaseService<RegisteredGrade> {
  constructor() {
    super(table)
  }

  async getRegisteredGradesIsCompletedStatus(teacherId: string | null, classroomId: string, disciplineId: string, stageId: string,) {
    const { data, error } = await this.client
      .from('registeredGrade')
      .select(`
        isCompleted
      `)
      .eq('teacherId', teacherId)
      .eq('classroomId', classroomId)
      .eq('disciplineId', disciplineId)
      .eq('stageId', stageId)

    if (error) {
      throw new Error(`Erro ao buscar validação de preenchimento: ${error.message}`)
    }
    return data[0] && data[0].isCompleted ? true : false
  }

  async updateRegisteredGradeIsCompleted(teacherId: string | null, classroomId: string, disciplineId: string, stageId: string, isCompleted: boolean) {
    const { data, error } = await this.client
      .from(table)
      .update({ isCompleted })

      .eq('teacherId', teacherId)
      .eq('classroomId', classroomId)
      .eq('disciplineId', disciplineId)
      .eq('stageId', stageId)

    if (error) {
      throw new Error(`Erro ao atualizar o status de conclusão: ${error.message}`)
    }

    return data
  }

  async upsertRegisteredGrade(registeredGrade: RegisteredToSave) {
    const { data, error } = await this.client
      .from('registeredGrade')
      .upsert(registeredGrade, { onConflict: 'teacherId, classroomId, disciplineId, stageId' })

    if (error) {
      throw new Error(`Erro ao criar ou atualizar nota registrada: ${error.message}`)
    }

    return data
  }
}
