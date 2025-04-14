import type { ThematicUnit } from '@prisma/client'
import BaseService from '@/services/BaseService'
import errorHandler from '@/utils/error-handler'

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
            errorHandler(error, 'Erro ao buscar unidades tematicas')
        }
        if (!data) {
            throw new Error('Nenhuma unidade tematica encontrada')
        }

        return data
    }
}