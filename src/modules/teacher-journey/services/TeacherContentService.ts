import BaseService from '@/services/BaseService'

 const table = 'institution' as const // Modifique para sua tabela

type TeacherJourneyServiceTable = typeof table

export default class TeacherJourneyService extends BaseService<TeacherJourneyServiceTable> {
  constructor() {
     super(table) // Passando o nome da tabela para a classe base
  }
}
