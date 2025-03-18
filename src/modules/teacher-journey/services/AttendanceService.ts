import type { Attendance } from '@prisma/client'
import type { AttendanceWithFrequencies, Frequency, TeacherFrequency } from '../types/types'
import BaseService from '@/services/BaseService'

const table = 'attendance' as const

export default class EnrollmentService extends BaseService<Attendance> {
  constructor() {
    super(table)
  }

  async getAttendanceByToday(selectedDate: string, classroomId: string) {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq('date', selectedDate)
      .eq('classroomId', classroomId)

    if (error) {
      throw new Error(`Erro listar todas as frequencias do dia ${selectedDate}: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma frequencia encontrada')
    }
    return data
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
          .from('numMissed')
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

  async createTeacherAttendance(teacherFrequency: TeacherFrequency) {
    console.log('createTeacherAttendance', teacherFrequency)
    const { data: dataAttendance, error: errorAttendance } = await this.client
      .from('teacherAttendance')
      .insert({
        date: teacherFrequency.date,
        totalClasses: teacherFrequency.totalClasses,
        type: teacherFrequency.type,
        teacherId: teacherFrequency.teacherId,
        classroomId: teacherFrequency.classroomId,
        disciplineId: teacherFrequency.disciplineId,
        stageId: teacherFrequency.stageId,
        schoolId: teacherFrequency.schoolId,
      })
      .select()
      .single()

    if (errorAttendance) {
      console.log('errorAttendance', teacherFrequency)
      throw new Error(`Erro ao inserir frequência do professor: ${errorAttendance.message}`)
    }
  }

  async listTeacherAttendance(teacherId: string, date: string, classroomId: string, type: string, disciplineId?: string) {
    let query = this.client
      .from('teacherAttendance')
      .select('*')
      .eq('teacherId', teacherId)
      .eq('date', date)
      .eq('classroomId', classroomId)
      .eq('type', type)

    if (type === 'DISCIPLINA' && disciplineId) {
      query = query.eq('disciplineId', disciplineId)
    }

    const { data: datalistTeacherAttendance, error: errorlistTeacherAttendance } = await query

    if (errorlistTeacherAttendance) {
      throw new Error(`Erro ao listar frequência do professor: ${errorlistTeacherAttendance.message}`)
    }

    return datalistTeacherAttendance
  }
}
