import type { ConceptualGrade } from '@prisma/client'
import BaseService from '@/services/BaseService'

const table = 'conceptualGrade' as const
export default class ConceptualGradeService extends BaseService<ConceptualGrade> {
  constructor() {
    super(table)
  }

  async getConceptualGrades(concept: { classroomId: string, disciplineId: string, stageId: string }) {
    const { data, error } = await this.client
      .from(table)
      .select(`*, enrollment:enrollmentId (classroomId)`)
      .eq('enrollment.classroomId', concept.classroomId)
      .eq('disciplineId', concept.disciplineId)
      .eq('stageId', concept.stageId)

    if (error) {
      throw new Error(`Erro ao buscar notas com dados dos alunos: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma nota encontrada')
    }

    return data
  }

  async getConceptualGradesByStageIds(concept: { classroomId: string, disciplineId: string, stageIds: string[] }) {
    const { data, error } = await this.client
      .from(table)
      .select(
        `
                *,
                enrollment:enrollmentId (id, name),
                conceptualGradeByThematicUnit:conceptualGradeByThematicUnit (id, grade)
                `,
      )
      .eq('enrollment.classroomId', concept.classroomId)
      .eq('disciplineId', concept.disciplineId)
      .in('stageId', concept.stageIds)

    if (error) {
      throw new Error(`Erro ao buscar notas com dados dos alunos: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma nota encontrada')
    }

    return data
  }

  async upsertConceptualGrade(concept: {
    classroomId: string
    disciplineId: string
    stageId: string
    thematicUnits: { id: string, grade: number }[]
  }) {
    const { data: conceptualGradeData, error: conceptualGradeError } = await this.client
      .from(table)
      .upsert({
        classroomId: concept.classroomId,
        disciplineId: concept.disciplineId,
        stageId: concept.stageId,
      }, { onConflict: 'classroomId,disciplineId,stageId' })
      .select('id')

    if (conceptualGradeError) {
      throw new Error(`Erro ao criar ou atualizar nota conceitual: ${conceptualGradeError.message}`)
    }
    if (!conceptualGradeData || conceptualGradeData.length === 0) {
      throw new Error('Nenhuma nota conceitual encontrada ou criada')
    }

    const conceptualGradeId = conceptualGradeData[0].id

    for (const thematicUnit of concept.thematicUnits) {
      const { error: thematicUnitError } = await this.client
        .from('conceptualGradeByThematicUnit')
        .upsert({
          conceptualGradeId,
          thematicUnitId: thematicUnit.id,
          grade: thematicUnit.grade,
        }, { onConflict: 'conceptualGradeId,thematicUnitId' })

      if (thematicUnitError) {
        throw new Error(`Erro ao criar ou atualizar nota por unidade temática: ${thematicUnitError.message}`)
      }
    }

    return { conceptualGradeId }
  }
}
