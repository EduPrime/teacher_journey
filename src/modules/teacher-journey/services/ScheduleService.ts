import type { Schedule } from '@prisma/client'
import BaseService from '@/services/BaseService'
import { ref } from 'vue'

const table = 'Schedule' as const

export default class ScheduleService extends BaseService<Schedule> {
  constructor() {
    super(table)
  }

  async countSchools(teacherId: string | null) {
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

  async countClassrooms(teacherId: string | null) {
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

  async listClassrooms(teacherId: string | null) {
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

  async getSchedule(teacherId: string | null) {
    const { data, error } = await this.client
      .from('schedule')
      .select(`
            *,
            classroom:classroomId (name),
            school:schoolId (name),
            discipline:disciplineId (name)
            `,
      )
      .eq('teacherId', teacherId)
      .order('start')

    if (error) {
      throw new Error(`Erro ao buscar horários: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhum horário encontrado')
    }

    return data
  }

  async getScheduleTeacherDay(teacherId: string, weekday: string, classroomId: string, disciplineId: string) {
    const { data, error } = await this.client
      .from('schedule')
      .select(`
            *,
            classroom:classroomId (id, name),
            school:schoolId (name),
            discipline:disciplineId (name)
            `,
      )
      .eq('teacherId', teacherId)
      .eq('weekday', weekday)
      .eq('classroomId', classroomId)
      .eq('disciplineId', disciplineId)
      .order('start')

    if (error) {
      throw new Error(`Erro ao buscar total de aulas: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma aula encontrado')
    }

    const count = data.length
    return { data, count }
  }

  async getCourse(teacherId: string) {
    try {
      const infoClass = await this.client
        .from('schedule')
        .select(`
            classroomId
            `,
        )
        .eq('teacherId', teacherId)

      const infoSerie = await this.client
        .from('classroom')
        .select(`
            seriesId
            `,
        )
        .eq('id', infoClass.data?.[0]?.classroomId)

      const infoCourse = await this.client
        .from('series')
        .select(`
            courseId
            `,
        )
        .eq('id', infoSerie.data?.[0]?.seriesId)

      const infoCourseName = await this.client
        .from('course')
        .select(`
            name
            `,
        )
        .eq('id', infoCourse.data?.[0]?.courseId)

      return infoCourseName.data?.[0]?.name
    }
    catch (error: any) {
      throw new Error(`Erro ao buscar curso: ${error.message}`)
    }
  }

  async getSchedules(teacherId: string) {
    // Criei interfaces para facilitar a leitura do código:
    // @TODO: Mover essas interfaces para um arquivo separado e posteriormente importar aqui
    interface ScheduleSchool {
      id: string
      name: string
    }
    interface ScheduleDisciplines {
      id: string
      name: string
    }
    interface AvailableDisciplines {
      id: string
      name: string
      classroomId: string
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
      discipline: ScheduleDisciplines
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
            discipline:discipline (id, name)
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
      const availableDisciplines = ref<AvailableDisciplines[]>([])
      // O map abaixo cria um novo array com as turmas
      const info = data.map((item: ScheduleInfo) => {
        // Aqui abaixo verificamos se a escola já está no array, se não estiver eu adiciono

        if (schools.value.length === 0 || schools.value.find((school: ScheduleSchool) => school.id !== item.school.id)) {
          // Aqui é criado um objeto com o id e o nome da escola e adiciono ao array de escolas
          schools.value.push(item.school)
        }

        if (!availableDisciplines.value.some((discipline: ScheduleDisciplines) => discipline.id === item.discipline.id)) {
          availableDisciplines.value.push({ ...item.discipline, classroomId: item.classroom.id })
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

      return { classesPerSchool, schools, availableDisciplines }
    }
  }
}
