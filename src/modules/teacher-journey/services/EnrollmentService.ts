import BaseService from '@/services/BaseService'
import type { Enrollment } from '@prisma/client'

 const table = 'enrollment' as const

export default class EnrollmentService extends BaseService<Enrollment> {
  constructor() {
     super(table)
  }

  async getClassroomStudents(classroomId: string) {
    const {data , error} = await this.client
        .from('enrollment')
        .select(`
            *,
            student:studentId (disability, classroomId)
            `
        )
        .eq('classroomId',classroomId)

        if (error) {
            throw new Error(`Erro ao buscar matrículas com dados dos alunos: ${error.message}`)
        }
        if (!data) {
            throw new Error('Nenhuma matrícula encontrada')
        }
        
        return data
  }
}
