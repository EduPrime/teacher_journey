import type { ConceptualGrade } from '@prisma/client'
import BaseService from '@/services/BaseService'
import type { ConceptualToSave, UpdatedGrades } from '../types/types'

const table = 'conceptualGrade' as const
export default class ConceptualGradeService extends BaseService<ConceptualGrade> {
    constructor() {
        super(table)
    }
    async createConceptualGrade(updatedGrades: UpdatedGrades[] | [], conceptualGrades: ConceptualToSave[]) {
        if (!conceptualGrades[0].conceptualGradeId) {
            for (const conceptualGrade of conceptualGrades) {
                const { grades, ...conceptualGradeData } = conceptualGrade;
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
                    .single();

                for (const grade of grades) {

                    await this.client
                        .from('conceptualGradeByThematicUnit')
                        .insert(
                            {
                                thematicUnitId: grade.thematicUnitId,
                                conceptualGradeId: conceptualGradeResult.id,
                                grade: grade.value
                            }
                        )
                }
                if (conceptualGradeError) {
                    throw new Error(`Erro ao criar nota conceitual: ${conceptualGradeError.message}`);
                }
                if (!conceptualGradeResult || conceptualGradeResult.length === 0) {
                    throw new Error('Falha ao criar nota conceitual');
                }
            }
        }
        else {
            for (const updatedGrade of updatedGrades) {
                await this.client
                    .from('conceptualGradeByThematicUnit')
                    .update({
                        grade: updatedGrade.grade
                    })
                    .eq('conceptualGradeId', updatedGrade.conceptualGradeId)
                    .eq('thematicUnitId', updatedGrade.thematicUnitId);
            }
        }

    }
}
