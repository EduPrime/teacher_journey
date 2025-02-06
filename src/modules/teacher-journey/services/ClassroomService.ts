import BaseService from '@/services/BaseService'
import type { Classroom } from '@prisma/client'

 const table = 'classroom' as const // Modifique para sua tabela

export default class ClassroomService extends BaseService<Classroom> {
  constructor() {
     super(table) // Passando o nome da tabela para a classe base
  }
}
