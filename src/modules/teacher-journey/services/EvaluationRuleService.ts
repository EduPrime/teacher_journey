import type { EvaluationRule } from '@prisma/client'
import BaseService from '@/services/BaseService'
import errorHandler from '@/utils/error-handler'

const table = 'evaluationRule' as const // Modifique para sua tabela

export default class EvaluationRuleService extends BaseService<EvaluationRule> {
  constructor() {
    super(table) // Passando o nome da tabela para a classe base
  }

  async getRulesFromCourse(courseId: string) {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq('courseId', courseId)

    if (error) {
      errorHandler(error, 'Erro ao trazer as regras de avaliação')
    }
    if (!data) {
      throw new Error('Nenhuma regra encontrada')
    }

    return data
  }

  async getConceptualGradesTypes(courseIds: string) {
    const { data, error } = await this.client
      .from(table)
      .select(
        `
        conceptualLabel
        `
      )
      .eq('courseId', courseIds)
      .single()

    const labels = data?.conceptualLabel.map((item: any) => item.rotulo)

    if (error) {
      errorHandler(error, 'Erro ao trazer os tipos de notas')
    }
    if (!data) {
      throw new Error('Nenhum tipo de nota encontrado')
    }

    return labels
  }
}
