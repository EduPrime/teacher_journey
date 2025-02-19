import BaseService from '@/services/BaseService'
import type { Classroom } from '@prisma/client'

const table = 'classroom' as const // Modifique para sua tabela

export default class ClassroomService extends BaseService<Classroom> {
  constructor() {
    super(table) // Passando o nome da tabela para a classe base
  }
  async listCLassroomAndSchools(classes: string[]) {
    const { data, error } = await this.client
      .from('classroom')
      .select('*, school:schoolId (name)')
      .in('id', classes)

    if (error) {
      throw new Error(`Erro ao buscar lista de turmas: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma turma encontrada')
    }

    const classroomMap = new Map<string, { school: string; classroom: string[] }>()

    data.forEach(item => {
      const schoolName = item.school?.name;
      const classroomName = item?.name;

      if (schoolName && classroomName) {
        if (!classroomMap.has(schoolName)) {
          classroomMap.set(schoolName, { school: schoolName, classroom: [] })
        }

        const schoolEntry = classroomMap.get(schoolName);
        if (schoolEntry && !schoolEntry.classroom.includes(classroomName)) {
          schoolEntry.classroom.push(classroomName);
        }
      }
    })
    return Array.from(classroomMap.values())
  }
}
