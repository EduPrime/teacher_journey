import type { Classroom } from '@prisma/client'
import BaseService from '@/services/BaseService'

const table = 'classroom' as const // Modifique para sua tabela

export default class ClassroomService extends BaseService<Classroom> {
  constructor() {
    super(table) // Passando o nome da tabela para a classe base
  }

  async getClassroom() {
    const { data, error } = await this.client
      .from(table)
      .select(`name, id, period, year, series:seriesId(id, name)`)
    // .eq('classroomId',classroomId)

    if (error) {
      throw new Error(`Erro ao trazer as turmas: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma turma encontrada')
    }

    return data
  }
}
