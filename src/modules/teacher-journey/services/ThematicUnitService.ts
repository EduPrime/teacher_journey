import type { ThematicUnit } from '@prisma/client'
import BaseService from '@/services/BaseService'

const table = 'thematicUnit' as const

export default class ThematicUnitService extends BaseService<ThematicUnit> {
    constructor() {
        super(table)
    }

    async getThematicUnits(concept: { classroomId: string, disciplineId: string, stageId: string }) {
        const { data, error } = await this.client
            .from(table)
            .select(`*, enrollment:enrollmentId (classroomId)`)
            .eq('enrollment.classroomId', concept.classroomId)
            .eq('disciplineId', concept.disciplineId)
            .eq('stageId', concept.stageId)

        if (error) {
            throw new Error(`Erro ao buscar unidade tematica com dados dos alunos: ${error.message}`)
        }
        if (!data) {
            throw new Error('Nenhuma unidade tematica encontrada')
        }

        return data
    }
}