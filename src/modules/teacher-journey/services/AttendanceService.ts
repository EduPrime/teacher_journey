import type { Attendance } from '@prisma/client'
import BaseService from '@/services/BaseService'
import type { Frequency, AttendanceWithFrequencies } from '../types/types'

const table = 'attendance' as const

export default class EnrollmentService extends BaseService<Attendance> {
  constructor() {
    super(table)
  }

  async createAttendance(frequencies: AttendanceWithFrequencies[]) {
    try {
      const attendanceRecords = []

      for (const frequency of frequencies) {
        // Insere o registro de frequência
        const { data: attendanceData, error: attendanceError } = await this.client
          .from(table)
          .insert([{
            date: frequency.date,
            studentId: frequency.studentId,
            classroomId: frequency.classroomId,
            presence: frequency.presence,
            enrollmentId: frequency.enrollmentId,
            disciplineId: frequency.disciplineId,
            justificationId: frequency.justificationId,
            stageId: frequency.stageId,
            schoolId: frequency.schoolId,
            updatedBy: frequency.updatedBy,
            tenantId: frequency.tenantId,
          }])
          .select()
          .single()

        if (attendanceError) {
          throw new Error(`Erro ao inserir frequência: ${attendanceError.message}`)
        }

        const attendanceId = attendanceData.id

        // Insere os registros relacionados na tabela numMissed
        const numMissedRecords = frequency.frequencies.map((f: Frequency) => ({
          attendanceId,
          name: f.name,
          absent: f.absence,
        }))
        const { error: numMissedError } = await this.client
          .from('nummissed')
          .insert(numMissedRecords)

        if (numMissedError) {
          throw new Error(`Erro ao inserir registros de ausência: ${numMissedError.message}`)
        }

        attendanceRecords.push(attendanceData)
      }

      return attendanceRecords
    }
    catch (error) {
      throw new Error(`Erro ao inserir frequência: ${error}`)
    }
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

  async updateAttendance(id: string, attendanceData: Partial<Attendance>) {
    const { data, error } = await this.client
      .from(table)
      .update(attendanceData)
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao atualizar a frequencia: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma frequencia encontrada para atualizar')
    }

    return data
  }

  async updateAttendanceDetails(id: string, numMissed: number, justification: string) {
    const { data, error } = await this.client
      .from(table)
      .update({ numMissed, justification })
      .eq('id', id)

    if (error) {
      throw new Error(`Erro ao atualizar detalhes da frequencia: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma frequencia encontrada para atualizar')
    }

    return data
  }
}
