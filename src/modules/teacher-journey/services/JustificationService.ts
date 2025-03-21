import type { Justification } from '@prisma/client'
import BaseService from '@/services/BaseService'

const table = 'justification' as const

export default class JustificationService extends BaseService<Justification> {
  constructor() {
    super(table)
  }

  async getJustifications() {
    const { data, error } = await this.client
      .from(table)
      .select(`*`)

    if (error) {
      throw new Error(`Erro ao buscar Justificativa de faltas: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma Justificativa encontrada')
    }

    return data
  }
}
