import BaseService from '@/services/BaseService'
import type { Schedule } from '@prisma/client'
import { ref } from 'vue'

const table = 'Schedule' as const

export default class ScheduleService extends BaseService<Schedule> {
  constructor() {
    super(table)
  }
  async countSchools(teacherId: string) {
    const { data, error } = await this.client
      .from('schedule')
      .select('schoolId')
      .eq('teacherId', teacherId)

    const countSchools = new Set()
    if (data) {
      data.forEach(item => countSchools.add(item.schoolId))
    }

    if (error) {
      throw new Error(`Erro ao contar o número de escolas: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma escola encontrada')
    }

    return countSchools.size
  }

  async countClassrooms(teacherId: string) {
    const { data, error } = await this.client
      .from('schedule')
      .select('classroomId')
      .eq('teacherId', teacherId)

    const countClassrooms = new Set()
    if (data) {
      data.forEach(item => countClassrooms.add(item.classroomId))
    }

    if (error) {
      throw new Error(`Erro ao contar o número de turmas: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma turma encontrada')
    }

    return countClassrooms.size
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
            classroom:classroom (name, series:series (id, name)),
            classroomId,
            schoolId,
            school:school (name),
            discipline:discipline (name)
            `
      ).eq('teacherId', teacherId)

    if (error) {
      throw new Error(`Erro ao buscar horários: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhum horário encontrado')
    } else {
      const schools = ref<{ id: string, name: string }[] | [] | any>([])
      const info = data.map((item: { classroomId: any, schoolId: any, classroom: { name: any, series: { id: any, name: any }[] }[], school: { name: any }[], discipline: { name: any }[] }) => {

        if (schools.value.length === 0 || schools.value.find((school: { id: string }) => school.id !== item.schoolId)) {
          const schoolItem: { id: string, name: string } = { id: item.schoolId, name: item.school[0].name }
          schools.value.push(schoolItem)
        }
        return {
          classroomId: item.classroomId,
          classroomName: item.classroom[0].name,
          schoolId: item.schoolId,
          schoolName: item.school[0].name,
          disciplineName: item.discipline[0].name,
          series: item.classroom[0].series[0].id,
          seriesName: item.classroom[0].series[0].name
        }
      });

      const classesPerSchool = schools.value.map((school: { id: string, name: string }) => {
        const classrooms = {
          schoolId: school.id,
          classes: info.filter((item: { schoolId: string }) => item.schoolId === school.id)
        }
        return classrooms
      }
      )
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
