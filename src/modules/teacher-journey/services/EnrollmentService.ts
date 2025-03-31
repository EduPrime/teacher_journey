import type { Enrollment } from '@prisma/client'
import BaseService from '@/services/BaseService'

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
      .eq('classroomId', classroomId);

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
      .in('enrollmentId', enrollmentIds)
      .eq('disciplineId', disciplineId)
      .eq('stageId', stageId)
      .eq('schoolId', schoolId);

    if (conceptualGradeError) {
      throw new Error(`Erro ao buscar notas conceituais: ${conceptualGradeError.message}`);
    }
    if (!conceptualGrades || conceptualGrades.length === 0) {
      const { data: emptyConceptualGrades, error: errorEmptyConceptualGrades } = await this.client
        .from('thematicUnit')
        .select(`
          id,
          name
        `)
        .eq('disciplineId', disciplineId)
        .eq('seriesId', seriesId)

      if (errorEmptyConceptualGrades) {
        throw new Error(`Erro ao buscar notas conceituais: ${errorEmptyConceptualGrades}`);
      }

      const result = enrollments.map((enrollment) => {
        return {
          name: enrollment.name,
          situation: enrollment.situation,
          // disability: enrollment.student?.disability ? true : false,
          // studentId: enrollment.student?.id,
          enrollmentId: enrollment.id,
          schoolId,
          classroomId,
          disciplineId,
          stageId,
          conceptualGradeId: null,
          grades: emptyConceptualGrades.map((unit) => ({
            thematicUnitId: unit.id,
            name: unit.name || '',
            value: null,
            gradeId: null,
          })) || [],
        };
      });
      return result;
    }
    const result = enrollments.map((enrollment) => {
      const conceptualGrade = conceptualGrades?.find((cg) => cg.enrollmentId === enrollment.id);

      return {
        name: enrollment.name,
        situation: enrollment.situation,
        // disability: enrollment.student?.disability ? true : false,
        // studentId: enrollment.student?.id,
        enrollmentId: enrollment.id,
        schoolId,
        classroomId,
        disciplineId,
        stageId,
        conceptualGradeId: conceptualGrade?.id || null,
        grades: conceptualGrade?.thematicUnits?.map((unit) => ({
          thematicUnitId: unit.thematicUnitId,
          // name: unit.thematicUnit?.name || '',
          value: unit.grade,
          gradeId: unit.conceptualGradeId,
        })) || [],
      };
    });

    return result;
  }
}
