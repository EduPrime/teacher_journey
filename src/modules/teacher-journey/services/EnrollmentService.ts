import type { Enrollment } from '@prisma/client'
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

    console.log('enrollments', enrollments)

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
      .in('enrollmentId', enrollmentIds) as unknown as QueryGrades

    if (conceptualGradeError) {
      throw new Error(`Erro ao buscar notas conceituais: ${conceptualGradeError.message}`);
    }

    console.log('conceptualGrades', conceptualGrades)
    const enrollmentsWithConceptualGrades = enrollments.filter((enrollment) => {
      return conceptualGrades?.some((cg) => cg.enrollmentId === enrollment.id)
    })

    const enrollmentsWithoutConceptualGrades = enrollments.filter((enrollment) => {
      return !conceptualGrades?.some((cg) => cg.enrollmentId === enrollment.id)
    })

    // console.log('enrollmentsWithConceptualGrades', enrollmentsWithConceptualGrades)
    // console.log('enrollmentsWithoutConceptualGrades', enrollmentsWithoutConceptualGrades)
    // console.log('enrollmentIds', enrollmentIds)
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
        conceptualGradeId: conceptualGrade?.id || null,
        grades: conceptualGrade?.thematicUnits?.map((unit) => ({
          thematicUnitId: unit.thematicUnitId,
          name: unit.thematicUnit?.name || '',
          value: unit.grade,
          gradeId: unit.conceptualGradeId,
        })) || [],
      };
    });
    console.log('result', result)
    if (conceptualGrades.length < enrollmentIds.length) {
      const { data: emptyConceptualGrades, error: errorEmptyConceptualGrades } = await this.client
        .from('thematicUnit')
        .select(`
          id,
          name
        `)
        .eq('disciplineId', disciplineId)
        .eq('seriesId', seriesId) as unknown as QueryEmptyGrades

      console.log('emptyConceptualGrades', emptyConceptualGrades)

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
          conceptualGradeId: null,
          grades: emptyConceptualGrades.map((unit) => ({
            thematicUnitId: unit.id,
            name: unit.name,
            value: null,
            gradeId: null,
          })),
        }
      }))
    }

    return result;
  }
}
