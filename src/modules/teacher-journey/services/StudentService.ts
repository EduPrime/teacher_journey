import BaseService from '@/services/BaseService'
import type { Student } from '@prisma/client'

 const table = 'student' as const // Modifique para sua tabela

export default class StudentService extends BaseService<Student> {
  constructor() {
     super(table) // Passando o nome da tabela para a classe base
  }
}
