import type { ConceptualGrade } from '@prisma/client'
import BaseService from '@/services/BaseService'
import type { Grades, MountedStudent } from '../types/types'

const table = 'conceptualGrade' as const
export default class ConceptualGradeService extends BaseService<ConceptualGrade> {
  constructor() {
    super(table)
  }
  async createConceptualGrade(student: MountedStudent) {
    const { grades, ...conceptualGradeData } = student;
    // Create a new conceptual grade
    const { data: conceptualGradeResult, error: conceptualGradeError } = await this.client
      .from(table)
      .insert(
        {
          studentId: conceptualGradeData.studentId,
          enrollmentId: conceptualGradeData.enrollmentId,
          classroomId: conceptualGradeData.classroomId,
          disciplineId: conceptualGradeData.disciplineId,
          schoolId: conceptualGradeData.schoolId,
          stageId: conceptualGradeData.stageId
        }
      )
      .select()
      .single()
    console.log(conceptualGradeResult)
    if (!conceptualGradeResult || !conceptualGradeResult.id) {
      throw new Error('Falha ao obter ID da nota conceitual criada');
    }

    const formattedGrades = grades.map(({ thematicUnitId, grade }) => ({
      thematicUnitId,
      grade,
      conceptualGradeId: conceptualGradeResult.id
    }));

    const { data: conceptualGradeByThematicUnitData, error: conceptualGradeByThematicUnitError } = await this.client
      .from('conceptualGradeByThematicUnit')
      .insert(
        formattedGrades
      )
      .select()

    if (conceptualGradeByThematicUnitError) {
      throw new Error(`Erro ao criar nota conceitual por unidade temática: ${conceptualGradeByThematicUnitError.message}`);
    }

    if (!conceptualGradeByThematicUnitData) {
      throw new Error('Falha ao criar nota conceitual por unidade temática');
    }

    if (conceptualGradeError) {
      throw new Error(`Erro ao criar nota conceitual: ${conceptualGradeError.message}`);
    }
    if (!conceptualGradeResult || conceptualGradeResult.length === 0) {
      throw new Error('Falha ao criar nota conceitual');
    }
    return conceptualGradeByThematicUnitData
  }
  async updateConceptualGrade(grades: Grades[]) {
    for (const grade of grades) {
      const { error: updateGradeError } = await this.client
        .from('conceptualGradeByThematicUnit')
        .update(
          {
            grade: grade.grade
          }
        )
        .eq('thematicUnitId', grade.thematicUnitId)
        .eq('conceptualGradeId', grade.conceptualGradeId)

      if (updateGradeError) {
        throw new Error(`Erro ao atualizar nota conceitual: ${updateGradeError.message}`);
      }
    }
  }

  async softDeleteConceptualGrade(conceptualGradeId: string) {
    const { error: deleteConceptualGradeError } = await this.client
      .from(table)
      .update({ deletedAt: new Date() })
      .eq('id', conceptualGradeId)

    if (deleteConceptualGradeError) {
      throw new Error(`Erro ao deletar nota conceitual: ${deleteConceptualGradeError.message}`);
    } else {
      const { error: deleteConceptualGradeByThematicUnitError } = await this.client
        .from('conceptualGradeByThematicUnit')
        .update({ deletedAt: new Date() })
        .eq('conceptualGradeId', conceptualGradeId)

      if (deleteConceptualGradeByThematicUnitError) {
        throw new Error(`Erro ao deletar nota conceitual por unidade temática: ${deleteConceptualGradeByThematicUnitError.message}`);
      }
    }

  }
}
