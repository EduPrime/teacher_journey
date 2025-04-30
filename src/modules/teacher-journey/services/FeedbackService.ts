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
    const now = new Date().toISOString()
    const { data: existing, error: fetchError } = await this.client
      .from(table)
      .select('*')
      .eq('enrollmentId', feedback.enrollmentId)
      .is('deletedAt', null)
      .maybeSingle()
    if (fetchError) errorHandler(fetchError, 'Erro ao buscar parecer existente')

    const payload: Partial<StudentFeedback> & { id?: string } = {
      studentId: feedback.studentId,
      enrollmentId: feedback.enrollmentId,
      schoolId: feedback.schoolId,
      teacherId: feedback.teacherId,
      disciplineId: feedback.disciplineId?.trim() || null,
      deletedAt: null,
      updatedAt: now,
      initialCreatedAt: existing?.initialCreatedAt || now,
      partialCreatedAt: existing?.partialCreatedAt || now,
      finalCreatedAt: existing?.finalCreatedAt || now,
      initialUpdatedAt: existing?.initialUpdatedAt || existing?.initialCreatedAt || now,
      partialUpdatedAt: existing?.partialUpdatedAt || existing?.partialCreatedAt || now,
      finalUpdatedAt: existing?.finalUpdatedAt || existing?.finalCreatedAt || now,
      ...(existing?.id && { id: existing.id }),
    }
    if (feedback.initialFeedback !== undefined) {
      payload.initialFeedback = feedback.initialFeedback
      payload.initialUpdatedAt = new Date(now)
    } else {
      payload.initialFeedback = existing?.initialFeedback || ''
    }
    if (feedback.partialFeedback !== undefined) {
      payload.partialFeedback = feedback.partialFeedback
      payload.partialUpdatedAt = new Date(now)
    } else {
      payload.partialFeedback = existing?.partialFeedback ?? null
    }
    if (feedback.finalFeedback !== undefined) {
      payload.finalFeedback = feedback.finalFeedback
      payload.finalUpdatedAt = new Date(now)
    } else {
      payload.finalFeedback = existing?.finalFeedback ?? null
    }
    const { data, error } = await this.client
      .from(table)
      .upsert(payload, { onConflict: 'enrollmentId' })
      .select()
    if (error) errorHandler(error, 'Erro ao inserir/atualizar parecer descritivo')
    return data as StudentFeedback[]
  }

  async softDeleteStudentFeedback(
    feedbackId: string,
    userId: string,
    stage?: 'inicial' | 'parcial' | 'final'
  ) {
    const now = new Date().toISOString()
    const prefixMap = { inicial: 'initial', parcial: 'partial', final: 'final' } as const
    const updateFields: Record<string, any> = {
      updatedBy: userId,
      updatedAt: now,
    }
    if (stage) {
      const prefix = prefixMap[stage]
      updateFields[`${prefix}Feedback`] = ''
      updateFields[`${prefix}UpdatedAt`] = now
    } else {
      updateFields.deletedAt = now
    }
    const { data, error } = await this.client
      .from(table)
      .update(updateFields)
      .eq('id', feedbackId)
    if (error) errorHandler(error, 'Erro ao apagar/limpar o parecer descritivo')
    return data ?? []
  }
}
