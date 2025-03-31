import type { Stage } from '@prisma/client'
import BaseService from '@/services/BaseService'
import { DateTime } from 'luxon'

const table = 'stage' as const

export default class StageService extends BaseService<Stage> {
  constructor() {
    super(table)
  }

  async getAllStages() {
    const { data, error } = await this.client
      .from('stage')
      .select('id, numberStage, startDate, endDate')
      .order('numberStage', { ascending: true })

    if (error) {
      console.error('getStages falhou e disparou erro ao buscar etapa:', error)
    }
    else if (data) {
      return data
    }
  }

  async getCurrentStage(institutionId: string) {
    const { data, error } = await this.client
      .from('stage')
      .select('id, numberStage, startDate, endDate')
      .eq('institutionId', institutionId)

    if (error) {
      throw new Error(`Erro ao buscar etapa atual: ${error.message}`)
    }
    if (!data || data.length === 0) {
      throw new Error('Nenhuma etapa encontrada')
    }

    const today = new Date()
    let stageId = null
    let currentStage = null
    let daysLeft: number | null = null

    for (const stage of data) {
      const startDate = new Date(stage.startDate)
      const endDate = new Date(stage.endDate)

      if (today >= startDate && today <= endDate) {
        stageId = stage.id
        currentStage = stage.numberStage
        daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        break
      }
    }

    if (!currentStage) {
      throw new Error('Nenhuma etapa está ativa no momento.')
    }

    return { stageId, currentStage, daysLeft }
  }

  async getCurrentStageWeekday(selectedDate: string) {
    const { data, error } = await this.client
      .from('stage')
      .select('id, numberStage, startDate, endDate')

    if (error) {
      throw new Error(`Erro ao buscar etapa atual: ${error.message}`)
    }
    if (!data || data.length === 0) {
      throw new Error('Nenhuma etapa encontrada')
    }

    const today = DateTime.fromISO(selectedDate).startOf('day')

    let stageId = null
    let currentStage = null

    for (const stage of data) {
      const startDate = DateTime.fromISO(stage.startDate).startOf('day')
      const endDate = DateTime.fromISO(stage.endDate).startOf('day')

      if (today >= startDate && today <= endDate) {
        stageId = stage.id
        currentStage = stage.numberStage
        break
      }
    }

    if (!currentStage) {
      throw new Error('Nenhuma etapa está ativa no momento.')
    }

    return { stageId, currentStage }
  }
}
