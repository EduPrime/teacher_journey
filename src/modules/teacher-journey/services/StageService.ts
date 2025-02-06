import BaseService from '@/services/BaseService'
import type { Stage } from '@prisma/client'

 const table = 'stage' as const

export default class StageService extends BaseService<Stage> {
  constructor() {
     super(table)
  }
}
