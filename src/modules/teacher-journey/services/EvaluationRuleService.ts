import type { EvaluationRule } from '@prisma/client'
import BaseService from '@/services/BaseService'

const table = 'evaluationRule' as const // Modifique para sua tabela

export default class EvaluationRuleService extends BaseService<EvaluationRule> {
  constructor() {
    super(table) // Passando o nome da tabela para a classe base
  }

  async getRulesFromCourse(courseId) {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq('courseId', courseId)

    if (error) {
      throw new Error(`Erro ao trazer as regras: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma regra encontrada')
    }

    return data
  }
}
