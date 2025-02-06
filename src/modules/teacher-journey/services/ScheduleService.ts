import BaseService from '@/services/BaseService'
import type { Schedule } from '@prisma/client'

 const table = 'schedule' as const

export default class ScheduleService extends BaseService<Schedule> {
  constructor() {
     super(table)
  }
  async countSchools(teacherId: string) {
    const {count, error} = await this.client
      .from('schedule')
      .select('count(distinct schoolId)')
      .eq('teacherId', teacherId)
    
      if (error) {
        throw new Error(`Erro ao contar o número de escolas: ${error.message}`)
      }
      if (!count) {
        throw new Error('Nenhuma escola encontrada')
      }

      return count
  }

  async countClassrooms(teacherId: string) {
    const {count, error} = await this.client
      .from('schedule')
      .select('count(distinct classroomId)')
      .eq('teacherId', teacherId)
    
      if (error) {
        throw new Error(`Erro ao contar o número de turmas: ${error.message}`)
      }
      if (!count) {
        throw new Error('Nenhuma turma encontrada')
      }

      return count
  }

  async listClassrooms(teacherId: string) {
    const {data, error} = await this.client
      .from('schedule')
      .select('classroomId', { distinct:true })
      .eq('teacherId', teacherId)
    
      if (error) {
        throw new Error(`Erro ao buscar turmas: ${error.message}`)
      }
      if (!data) {
        throw new Error('Nenhuma turma encontrada')
      }

      return data
  }

  async getSchedule(teacherId: string) {
    const {data , error} = await this.client
        .from('schedule')
        .select(`
            *,
            classroom:classroomId (name),
            school:schoolId (name),
            discipline:disciplineId (name),
            `
        ).eq('teacherId', teacherId)

        if (error) {
            throw new Error(`Erro ao buscar horários: ${error.message}`)
        }
        if (!data) {
            throw new Error('Nenhum horário encontrado')
        }
        
        return data
  }
}
