import type { StudentFeedback } from '@prisma/client'
import BaseService from '@/services/BaseService'
import errorHandler from '@/utils/error-handler'

interface FeedbackToSave {
  id?: string
  studentId: string
  enrollmentId: string
  schoolId: string
  disciplineId?: string | null
  teacherId: string
  initialFeedback: string
  partialFeedback?: string
  finalFeedback?: string
}

const table = 'studentFeedback' as const

export default class FeedbackService extends BaseService<StudentFeedback> {
  constructor() {
    super(table)
  }

  async getStudentFeedback(enrollmentId: string) {
    if (!enrollmentId) {
      return []
    }
    const { data, error } = await this.client
      .from(table)
      .select('*')

      .eq('enrollmentId', enrollmentId)
      .is('deletedAt', null)

    if (error) {
      errorHandler(error, 'Erro ao buscar parecer descritivo')
    }
    return data as StudentFeedback[]
  }

  async upsertStudentFeedback(feedback: FeedbackToSave) {
    if (!feedback.enrollmentId || !feedback.schoolId || !feedback.teacherId) {
      console.warn(`upsertStudentFeedback: missing enrollmentId or schoolId for ${feedback.studentId}`)
      return []
    }
    const payload = {
      ...feedback,
      disciplineId: feedback.disciplineId?.trim() || null,
      deletedAt: null,
    }

    const { data, error } = await this.client
      .from(table)
      .upsert(payload, { onConflict: 'enrollmentId' })
      .select()

    if (error) {
      errorHandler(error, 'Erro ao inserir/atualizar parecer descritivo')
    }
    return data as StudentFeedback[]
  }

  async softDeleteStudentFeedback(feedbackId: string, userId: string) {

    try {
      const { data, error } = await this.client
        .from(table)
        .update({
          deletedAt: new Date().toISOString(),
          updatedBy: userId
        })
        .eq('id', feedbackId)

      if (error) {
        errorHandler(error, 'Erro ao apagar o parecer descritivo do aluno')
      }

      return data
    }
    catch (error) {
      errorHandler(error, 'Erro inesperado ao apagar o parecer descritivo do aluno')
    }
  }
}
