import type { ConceptualGrade } from '@prisma/client'
import BaseService from '@/services/BaseService'
import type { ConceptualToSave } from '../types/types'

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

    async createConceptualGrade(conceptualGrade: ConceptualToSave) {
        const { data, error } = await this.client
            .from(table)
            .insert(conceptualGrade)
            .select()

        if (error) {
            throw new Error(`Erro ao criar nota conceitual: ${error.message}`)
        }
        if (!data || data.length === 0) {
            throw new Error('Falha ao criar nota conceitual')
        }

        return data
    }
}
