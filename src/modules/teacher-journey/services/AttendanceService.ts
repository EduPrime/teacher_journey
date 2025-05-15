import type { Attendance } from '@prisma/client'
import type { AttendanceWithFrequencies, Frequency, TeacherFrequency, WarningFrequency } from '../types/types'
import BaseService from '@/services/BaseService'
import errorHandler from '@/utils/error-handler'

const table = 'attendance' as const

export default class EnrollmentService extends BaseService<Attendance> {
  constructor() {
    super(table)
  }

  async listWarningAttendance(warningInfo: WarningFrequency): Promise<{ data: any, info: boolean }> {
    let query = this.client
      .from(table)
      .select(`
        id, date, classroom:classroom (name), discipline:discipline (name)
      `)
      .eq('teacherId', warningInfo.teacherId)
      .eq('date', warningInfo.date)
      .eq('classroomId', warningInfo.classroomId)

    if (warningInfo.disciplineId) {
      query = query.eq('disciplineId', warningInfo.disciplineId)
    }

    const { data, error } = await query

    if (error) {
      errorHandler(error, 'Erro ao listar frequencias')
    }

    return {
      data,
      info: !!(data && data.length > 0),
    }
  }

  async getAttendanceByToday(selectedDate: string, classroomId: string, disciplineId?: string) {
    const fields = `*,
        frequencies: numMissed (id, name, absent)`
    const { data, error } = disciplineId
      ? await this.client
        .from(table)
        .select(
          fields,
        )
        .eq('date', selectedDate)
        .eq('classroomId', classroomId)
        .eq('disciplineId', disciplineId)
      : await this.client
        .from(table)
        .select(
          fields,
        )
        .eq('date', selectedDate)
        .eq('classroomId', classroomId)

    if (error) {
      errorHandler(error, 'Erro ao listar frequencias')
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
        // Construir o registro de frequência
        const attendanceRecord = {
          date: frequency.date,
          studentId: frequency.studentId,
          classroomId: frequency.classroomId,
          presence: frequency.presence,
          enrollmentId: frequency.enrollmentId,
          stageId: frequency.stageId,
          schoolId: frequency.schoolId,
          updatedBy: frequency.updatedBy,
          tenantId: frequency.tenantId,
          teacherId: frequency.teacherId,
          disciplineId: frequency.disciplineId !== undefined ? frequency.disciplineId : '6b0cb88e-80a1-4185-a0b4-b625bb26b5fc', // Explicitamente define id da Disciplina Geral
          ...(frequency.justificationId ? { justificationId: frequency.justificationId } : null),
        }

        // Especificar as colunas de conflito de maneira mais simples
        const conflictColumns = ['studentId', 'classroomId', 'enrollmentId', 'date', 'disciplineId']

        // Realiza o upsert na tabela principal (attendance)
        const { data: attendanceData, error: attendanceError } = await this.client
          .from('attendance')
          .upsert([attendanceRecord], { onConflict: conflictColumns.join(',') })
          .select()
          .single()

        if (attendanceError) {
          errorHandler(attendanceError, 'Erro ao inserir ou atualizar frequência')
        }



        const attendanceId = attendanceData.id

        // Verificar se frequency.frequencies está definido
        if (frequency.frequencies) {
          // Upsert para os registros de ausência (numMissed)
          const numMissedRecords = frequency.frequencies.map((f: Frequency) => ({
            attendanceId,
            name: f.name,
            absent: f.absent,
          }))

          const { error: numMissedError } = await this.client
            .from('numMissed')
            .upsert(numMissedRecords, { onConflict: 'attendanceId, name' }) // Garante atualização correta

          if (numMissedError) {
            errorHandler(numMissedError, 'Erro ao inserir ou atualizar frequências de ausência')
          }
        }

        attendanceRecords.push(attendanceData)
      }

      return attendanceRecords
    }
    catch (error) {
      errorHandler(error, 'Erro ao inserir ou atualizar frequência')
    }
  }

  async listAttendanceAll(enrollmentId: string | null) {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq('enrollmentId', enrollmentId)

    if (error) {
      errorHandler(error, 'Erro ao listar frequencias')
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
      errorHandler(error, 'Erro ao atualizar frequência')
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
      errorHandler(error, 'Erro ao atualizar frequência')
    }
    if (!data) {
      throw new Error('Nenhuma frequencia encontrada para atualizar')
    }

    return data
  }

  async createTeacherAttendance(teacherFrequency: TeacherFrequency) {
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
      errorHandler(errorAttendance, 'Erro ao inserir frequência do professor')
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
      errorHandler(errorlistTeacherAttendance, 'Erro ao listar frequencias do professor')
    }

    return datalistTeacherAttendance
  }
}
