import type { ExamGrade } from '@prisma/client'
import BaseService from '@/services/BaseService'

const table = 'examGrade' as const
export default class ExamService extends BaseService<ExamGrade> {
  constructor() {
    super(table)
  }

  async getGradesByDisciplines(disciplineId: string[]) {
    const { data, error } = await this.client
      .from('examGrade')
      .select('*, enrollment:enrollmentId (classroomId), discipline:disciplineId (id, name)')
      .in('disciplineId', disciplineId)

    if (error) {
      throw new Error(`Erro ao buscar notas com dados dos alunos: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma nota encontrada')
    }

    return data
  }

  async getGrades(classroomId: string, disciplineId: string, stageId: string) {
    const { data, error } = await this.client
      .from('examGrade')
      .select('*, enrollment:enrollmentId (classroomId)')
      .eq('enrollment.classroomId', classroomId)
      .eq('disciplineId', disciplineId)
      .eq('stageId', stageId)

    if (error) {
      throw new Error(`Erro ao buscar notas com dados dos alunos: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma nota encontrada')
    }

    return data
  }
}
