import type { Justification } from '@prisma/client'
import BaseService from '@/services/BaseService'
import errorHandler from '@/utils/error-handler'

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
      errorHandler(error, 'Erro ao trazer as justificativas')
    }
    if (!data) {
      throw new Error('Nenhuma Justificativa encontrada')
    }

    return data
  }
}
