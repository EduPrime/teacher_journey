import BaseService from '@/services/BaseService'
import type { Stage } from '@prisma/client'

 const table = 'stage' as const

export default class StageService extends BaseService<Stage> {
  constructor() {
     super(table)
  }
  async getCurrentStage(institutionId: string) {
    const {data , error} = await this.client
      .from('stage')
      .select('numberStage, startDate, endDate')
      .eq('institutionId', institutionId)
    
      if (error) {
        throw new Error(`Erro ao buscar etapa atual: ${error.message}`)
      }
      if (!data || data.length === 0) {
        throw new Error('Nenhuma etapa encontrada')
      }

      const today = new Date()
      let currentStage = null
      let daysLeft: number | null = null
  
      for (const stage of data) {
          const startDate = new Date(stage.startDate)
          const endDate = new Date(stage.endDate)
  
          if (today >= startDate && today <= endDate) {
              currentStage = stage.numberStage;
              daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
              break;
          }
      }
  
      if (!currentStage) {
          throw new Error("Nenhuma etapa está ativa no momento.")
      }
  
      return { currentStage, daysLeft }
  }
}
