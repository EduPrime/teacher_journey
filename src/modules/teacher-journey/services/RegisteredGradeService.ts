import type { RegisteredGrade } from '@prisma/client'
import type { RegisteredToSave } from '../types/types'
import BaseService from '@/services/BaseService'
import errorHandler from '@/utils/error-handler'

const table = 'registeredGrade' as const
export default class RegisteredGradeService extends BaseService<RegisteredGrade> {
  constructor() {
    super(table)
  }

  async getRegisteredGrade(teacherId: string | null, classroomId: string, disciplineId: string, stageId: string) {
    const { data, error } = await this.client
      .from('registeredGrade')
      .select(`*`)
      .eq('teacherId', teacherId)
      .eq('classroomId', classroomId)
      .eq('disciplineId', disciplineId)
      .eq('stageId', stageId)
      .single()

    if (error) {
      // errorHandler(error, 'Erro ao buscar status de notas registradas')
    }
    if (data) {
      return data
    }
    return null
  }

  async getRegisteredGradesIsCompletedStatus(teacherId: string | null, classroomId: string, disciplineId: string, stageId: string) {
    const { data, error } = await this.client
      .from('registeredGrade')
      .select(`
        isCompleted
      `)
      .eq('teacherId', teacherId)
      .eq('classroomId', classroomId)
      .eq('disciplineId', disciplineId)
      .eq('stageId', stageId)
      .single()

    if (error) {
      // errorHandler(error, 'Erro ao buscar status de notas registradas')
    }
    if (data && data.isCompleted) {
      return true
    }
    return false
  }

  async getRegisteredGradeTimestamps(teacherId: string | null, classroomId: string, disciplineId: string, stageId: string) {
    const { data, error } = await this.client
      .from('registeredGrade')
      .select(`
        id,
        createdAt,
        updatedAt
      `)
      .eq('teacherId', teacherId)
      .eq('classroomId', classroomId)
      .eq('disciplineId', disciplineId)
      .eq('stageId', stageId)
      .single()

    if (error) {
      // errorHandler(error, 'Erro ao buscar timestamps de notas registradas')
    }

    if (data) {
      return {
        id: data.id,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }
    }

    return data
  }

  async getGradesReleasedInfo(itemToSearch: RegisteredToSave) {
    const { data, error } = await this.client
      .from('registeredGrade')
      .select(`
        areGradesReleased
      `)
      .eq('teacherId', itemToSearch.teacherId)
      .eq('classroomId', itemToSearch.classroomId)
      .eq('disciplineId', itemToSearch.disciplineId)
      .eq('stageId', itemToSearch.stageId)
      .single()

    if (error) {
      console.log(error, 'Erro ao buscar status de liberação de notas ou inexistentes')
    }

    if (data && data.areGradesReleased !== undefined) {
      return data.areGradesReleased
    }

    return false
  }

  async setAreGradesReleasedToFalse(filterInfo: RegisteredToSave) {
    // Garantir que o botão "salvar" altere a coluna areGradesReleased como "notas NÃO lançadas" e espere o botão "lançar notas" para alterar para "notas lançadas" mesmo depois de um F5
    const registeredGrade = {
      ...filterInfo,
      areGradesReleased: false,
    }

    const { data, error } = await this.client
      .from('registeredGrade')
      .upsert(registeredGrade, { onConflict: 'teacherId, classroomId, disciplineId, stageId' })

    if (error) {
      errorHandler(error, 'Erro ao atualizar ou inserir status de liberação de notas para pendente')
      return false
    }

    return !!data
  }

  async getRegistered(classroomId: string, disciplineId: string, stageId: string) {
    if (stageId) {
      const { data, error } = await this.client
        .from('registeredGrade')
        .select(`*`)
        .eq('classroomId', classroomId)
        .eq('disciplineId', disciplineId)
        .eq('stageId', stageId)
        .is('deletedAt', null)

      if (error) {
        errorHandler(error, 'Erro ao buscar notas registradas')
      }
      if (!data || data.length === 0) {
        return null
      }

      return data[0]
    }
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
      errorHandler(error, 'Erro ao atualizar status de notas registradas')
    }

    return data
  }

  async upsertRegisteredGrade(registeredGrade: RegisteredToSave) {
    // Garantir que o upsert mantenha a coluna areGradesReleased como "notas lançadas" por motivos óbvios
    const records = { ...registeredGrade, areGradesReleased: true }

    const { data, error } = await this.client
      .from('registeredGrade')
      .upsert(records, { onConflict: 'teacherId, classroomId, disciplineId, stageId' })

    if (error) {
      errorHandler(error, 'Erro ao atualizar ou inserir nota')
    }

    return data
  }

  async AreGradesReleasedToFalse(filterInfo: RegisteredToSave) {
    // Verifica se o item já existe
    const existingRecord = await this.getRegisteredGrade(
      filterInfo.teacherId ?? null,
      filterInfo.classroomId,
      filterInfo.disciplineId,
      filterInfo.stageId,
    )

    // Se não existir, retorna false e não avança
    if (!existingRecord) {
      console.warn('Registro não encontrado. Não é possível avançar.')
      return false
    }

    // Atualiza o status de areGradesReleased para false
    const registeredGrade = {
      ...filterInfo,
      areGradesReleased: false,
    }

    const { data, error } = await this.client
      .from('registeredGrade')
      .upsert(registeredGrade, { onConflict: 'teacherId, classroomId, disciplineId, stageId' })

    if (error) {
      errorHandler(error, 'Erro ao atualizar ou inserir status de liberação de notas para pendente')
      return false
    }

    return !!data
  }
}
