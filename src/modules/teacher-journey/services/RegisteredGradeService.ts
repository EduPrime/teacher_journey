import type { RegisteredGrade } from '@prisma/client'
import BaseService from '@/services/BaseService'

const table = 'registeredGrade' as const
export default class RegisteredGradeService extends BaseService<RegisteredGrade> {
  constructor() {
    super(table)
  }
}
