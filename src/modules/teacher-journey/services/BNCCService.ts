import BaseService from '@/services/BaseService'
// import type { BNCC } from '@prisma/client'

const table = 'bncc' as const // Modifique para sua tabela

export default class BNCCService extends BaseService<any> {
  constructor() {
    super(table) // Passando o nome da tabela para a classe base
  }

  async getBNCC(disciplineIds: string[], seriesId: string) {
    const fields = `id, 
        discipline:disciplineId(id, name), 
        code, objective, 
        knowledgeArea, 
        knowledgeObjects, 
        languagePractice, 
        seriesId`
    const { data, error } = await this.client
      .from(table)
      .select(fields)
      .eq('seriesId', seriesId)
      .in('disciplineId', disciplineIds)

    // .eq('classroomId',classroomId)
    if (error) {
      throw new Error(`Erro ao trazer os curriculos: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhum curriculo encontrado')
    }

    return data
  }
}
