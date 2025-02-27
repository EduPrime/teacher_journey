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

  async getCourse(teacherId: string) {
    const { data, error } = await this.client
      .from('schedule')
      .select(`
          classroom:classroom (serie:serie ( course:course (name))),
          `
      ).eq('teacherId', teacherId)

    if (error) {
      throw new Error(`Erro ao buscar curso: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhum horário encontrado')
    }

    return data
  }

  async getSchedules(teacherId: string) {
    // Criei interfaces para facilitar a leitura do código:
    // @TODO: Mover essas interfaces para um arquivo separado e posteriormente importar aqui
    interface ScheduleSchool {
      id: string
      name: string
    }
    interface ScheduleClassroom {
      id: string
      name: string
      series: {
        id: string
        name: string
      }
    }
    interface ScheduleInfo {
      classroom: ScheduleClassroom
      school: ScheduleSchool
      discipline: {
        name: string
      }
    }

    interface Classerooms {
      classroomId: string
      classroomName: string
      schoolId: string
      schoolName: string
      disciplineName: string
      seriesId: string
      seriesName: string
    }

    interface ClassesPerSchool {
      schoolId: string
      classes: Classerooms[]
    }

    // A estrutura de data é um array de ScheduleInfo, sendo school e classroom objetos dentro de data e series um objeto dentro de classroom
    const { data, error }: { data: ScheduleInfo[] | any, error: unknown | any } = await this.client
      .from('schedule')
      .select(`
            classroom:classroom (id, name, series:series (id, name)),
            school:school (id, name),
            discipline:discipline (name)
            `)
      .eq('teacherId', teacherId)

    if (error) {
      throw new Error(`Erro ao buscar horários: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhum horário encontrado')
    }
    else {
      const schools = ref<ScheduleSchool[]>([])
      // O map abaixo cria um novo array com as turmas
      const info = data.map((item: ScheduleInfo) => {
        // Aqui abaixo verificamos se a escola já está no array, se não estiver eu adiciono
        if (schools.value.length === 0 || schools.value.find((school: ScheduleSchool) => school.id !== item.school.id)) {
          // Aqui é criado um objeto com o id e o nome da escola e adiciono ao array de escolas
          const schoolItem: ScheduleSchool = { id: item.school.id, name: item.school.name }
          schools.value.push(schoolItem)
        }
        // Aqui é retornado um objeto com as informações da turma organizadas como eu preciso
        return {
          classroomId: item.classroom.id,
          classroomName: item.classroom.name,
          schoolId: item.school.id,
          schoolName: item.school.name,
          disciplineName: item.discipline.name,
          seriesId: item.classroom.series.id,
          seriesName: item.classroom.series.name,
        }
      })

      // Aqui é criado um array de objetos com as turmas separadas por escola
      const classesPerSchool: ClassesPerSchool[] = schools.value.map((school: ScheduleSchool) => {
        const classrooms: ClassesPerSchool = {
          schoolId: school.id,
          classes: info.filter((item: Classerooms) => item.schoolId === school.id),
        }
        return classrooms
      })

      return { classesPerSchool, schools }
    }
  }
}
