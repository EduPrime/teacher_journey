import BaseService from '@/services/BaseService'
import type { Schedule } from '@prisma/client'
import { ref } from 'vue'

 const table = 'schedule' as const

export default class ScheduleService extends BaseService<Schedule> {
  constructor() {
     super(table)
  }
  async countSchools(teacherId: string) {
    const { count, error } = await this.client
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
    const { count, error } = await this.client
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
    const { data, error }: { data: { classroomId: string }[] | null, error: any } = await this.client
      .from('schedule')
      .select('classroomId')
      .eq('teacherId', teacherId)
    
      if (error) {
        throw new Error(`Erro ao buscar turmas: ${error.message}`)
      }
      if (!data || data.length === 0) {
        throw new Error('Nenhuma turma encontrada')
      }
      const classArray: string[] = []
      data.forEach(item => classArray.push(item.classroomId))
    const classSet = new Set(classArray)
    return classSet
  }

  async getSchedule(teacherId: string) {
    const { data, error } = await this.client
        .from('schedule')
        .select(`
            *,
            classroom:classroomId (name),
            school:schoolId (name),
            discipline:disciplineId (name)
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

  async getSchedules(teacherId: string) {
    const { data, error } = await this.client
      .from('schedule')
      .select(`
          classroom:classroomId (name, series:seriesId (id, name)),
          classroomId,
          schoolId,
          school:schoolId (name),
          discipline:disciplineId (name)
          `).eq('teacherId', teacherId)

    if (error) {
      throw new Error(`Erro ao buscar horários: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhum horário encontrado')
    }
    else {
      const schools = ref< { id: string, name: string }[] | [] | any>([])
      const info = data.map((item: { classroomId: string, schoolId: string, disciplineId: string, classroom: { name: string, series: { id: string, name: string} }, school: { name: string }, discipline: { name: string } }) => {
        if (schools.value.length === 0 || schools.value.find(school => school.id !== item.schoolId)) {
          const schoolItem = { id: item.schoolId, name: item.school.name }
          schools.value.push(schoolItem)
        }
        return {
          classroomId: item.classroomId,
          classroomName: item.classroom.name,
          schoolId: item.schoolId,
          schoolName: item.school.name,
          disciplineName: item.discipline.name,
          seriesId: item.classroom.series.id,
          seriesName: item.classroom.series.name,
        }
      })
      const classesPerSchool = schools.value.map((school: { id: string, name: string }) => {
        const classrooms = {
          schoolId: school.id,
          classes: info.filter((item: { schoolId: string }) => item.schoolId === school.id),
        }
        return classrooms
      },
      )

      // console.log('#Data:', data)
      // const ddd = data.reduce((acc: Record<string, Classroom[]>, item) => {
      //   if (!acc[item.schoolId]) {
      //     acc[item.schoolId] = [];
      //   }
      //   acc[item.schoolId].push(item);
      //   return acc;
      // }, {});
      return { classesPerSchool, schools }
      // return schools.value
    }
  }
}
