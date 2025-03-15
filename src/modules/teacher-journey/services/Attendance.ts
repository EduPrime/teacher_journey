import type { Attendance } from '@prisma/client'
import BaseService from '@/services/BaseService'

const table = 'attendance' as const

export default class EnrollmentService extends BaseService<Attendance> {
    constructor() {
        super(table)
    }
    async listAttendanceAll(enrollmentId: string | null) {
        const { data, error } = await this.client
            .from(table)
            .select('*')
            .eq('enrollmentId', enrollmentId)

        if (error) {
            throw new Error(`Erro listar todas as frequencias: ${error.message}`)
        }
        if (!data) {
            throw new Error('Nenhuma frequencia encontrada')
        }

        return data
    }

}
