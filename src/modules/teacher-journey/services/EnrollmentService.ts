import { status, type Enrollment } from '@prisma/client'
import BaseService from '@/services/BaseService'
import { QueryEnrollments, QueryGrades, QueryEmptyGrades } from '../types/types'

const table = 'enrollment' as const

export default class EnrollmentService extends BaseService<Enrollment> {
  constructor() {
    super(table)
  }

  async getClassroomStudents(classroomId: string) {
    const { data, error } = await this.client
      .from('enrollment')
      .select(`
            *,
            student:student (disability)
            `,
      )
      .eq('classroomId', classroomId)

    if (error) {
      throw new Error(`Erro ao buscar matrículas com dados dos alunos: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma matrícula encontrada')
    }

    return data
  }
  async getClassroomConceptualGrades(classroomId: string, schoolId: string, disciplineId: string, stageId: string, seriesId: string) {
    const { data: enrollments, error: enrollmentError } = await this.client
      .from('enrollment')
      .select(`
        id,
        name,
        situation,
        student:student (id, disability)
      `)
      .eq('classroomId', classroomId) as unknown as QueryEnrollments

    if (enrollmentError) {
      throw new Error(`Erro ao buscar matrículas com dados dos alunos: ${enrollmentError.message}`);
    }
    if (!enrollments || enrollments.length === 0) {
      throw new Error('Nenhuma matrícula encontrada');
    }

    const enrollmentIds = enrollments.map((enrollment) => enrollment.id);

    const { data: conceptualGrades, error: conceptualGradeError } = await this.client
      .from('conceptualGrade')
      .select(`
        id,
        enrollmentId,
        thematicUnits:conceptualGradeByThematicUnit (
          thematicUnitId,
          conceptualGradeId,
          grade,
          thematicUnit:thematicUnit (name)
        )
      `)
      .eq('disciplineId', disciplineId)
      .eq('stageId', stageId)
      .eq('schoolId', schoolId)
      .in('enrollmentId', enrollmentIds)
      .is('deletedAt', null) as unknown as QueryGrades

    if (conceptualGradeError) {
      throw new Error(`Erro ao buscar notas conceituais: ${conceptualGradeError.message}`);
    }

    const enrollmentsWithConceptualGrades = enrollments.filter((enrollment) => {
      return conceptualGrades?.some((cg) => cg.enrollmentId === enrollment.id)
    })

    const enrollmentsWithoutConceptualGrades = enrollments.filter((enrollment) => {
      return !conceptualGrades?.some((cg) => cg.enrollmentId === enrollment.id)
    })

    const result = enrollmentsWithConceptualGrades.map((enrollment) => {
      const conceptualGrade = conceptualGrades?.find((cg) => cg.enrollmentId === enrollment.id);

      return {
        name: enrollment.name,
        situation: enrollment.situation,
        disability: (enrollment.student?.disability?.length ?? 0) > 0 ? true : false,
        studentId: enrollment.student?.id,
        enrollmentId: enrollment.id,
        schoolId,
        classroomId,
        disciplineId,
        stageId,
        seriesId,
        conceptualGradeId: conceptualGrade?.id || null,
        grades: conceptualGrade?.thematicUnits?.map((unit) => ({
          thematicUnitId: unit.thematicUnitId,
          name: unit.thematicUnit?.name || '',
          grade: unit.grade,
          conceptualGradeId: unit.conceptualGradeId,
        })) || [],
        status: enrollment.situation !== 'CURSANDO' ? 'BLOQUEADO' : conceptualGrade?.thematicUnits?.length === conceptualGrade?.thematicUnits?.filter((grade) => grade.grade != '').length ? 'CONCLUIDO' : 'INCOMPLETO',
      };
    });
    if (conceptualGrades.length < enrollmentIds.length) {
      const { data: emptyConceptualGrades, error: errorEmptyConceptualGrades } = await this.client
        .from('thematicUnit')
        .select(`
          id,
          name
        `)
        .eq('disciplineId', disciplineId)
        .eq('seriesId', seriesId) as unknown as QueryEmptyGrades

      if (errorEmptyConceptualGrades) {
        throw new Error(`Erro ao buscar notas conceituais: ${errorEmptyConceptualGrades}`);
      }
      result.push(...enrollmentsWithoutConceptualGrades.map((enrollment) => {
        return {
          name: enrollment.name,
          situation: enrollment.situation,
          disability: enrollment.student?.disability ? true : false,
          studentId: enrollment.student?.id,
          enrollmentId: enrollment.id,
          schoolId,
          classroomId,
          disciplineId,
          stageId,
          seriesId,
          conceptualGradeId: null,
          grades: emptyConceptualGrades.map((unit) => ({
            thematicUnitId: unit.id,
            name: unit.name,
            grade: '',
            conceptualGradeId: '',
          })),
          status: enrollment.situation !== 'CURSANDO' ? 'BLOQUEADO' : 'INCOMPLETO',
        }
      }))
    }
    return result.sort((a, b) => a.name.localeCompare(b.name))
  }
}
