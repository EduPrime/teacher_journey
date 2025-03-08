import type { Content } from '@prisma/client'
import BaseService from '@/services/BaseService'

const table = 'content' as const

export default class ContentService extends BaseService<Content> {
  constructor() {
    super(table)
  }

  async listContentTeacherId(teacherId: string) {
    const { data, error } = await this.client
      .from('content')
      .select('*')
      .eq('teacherId', teacherId)

    if (error) {
      throw new Error(`Erro ao encontrar conteúdo: ${error.message}`)
    }
    return data
  }

  async listContentByToday(classroomId: string, date: string) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await this.client
      .from('content')
      .select(`
            id,
            date,
            description,
            teacherId,
            classroom: classroomId (id, name),
            disciplines: content_discipline (disciplineId (id, name)),
            bnccs: content_bncc (bnccId (id, code, objective))
            `)
      .eq('date', date)
      .eq('classroomId', classroomId)
    // .eq('teacherId', teacherId) // @TODO: teacherId não é util para ser um parametro do filtro ( pode ser que o professor mude durante o decorrer do ano )

    if (error) {
      throw new Error(`Erro ao encontrar conteúdo: ${error.message}`)
    }
    if (!data || data.length === 0) {
      throw new Error('Nenhum conteúdo encontrado')
    }

    const contentMap = data.map((item: any) => ({
      classroom: item.classroom.name,
      classroomId: item.classroom.id,
      teacherId: item.teacherId,
      date: item.date,
      description: item.description,
      disciplines: item.disciplines,
      bnccs: item.bnccs,
    }))
    return contentMap
  }

  async createContent(content: { date: string, description: string, classroomId: string, teacherId: string, disciplines: string[], bnccs: string[] }) {
    try {
      // Insere primeiro o conteúdo
      const { data: contentData, error: contentError } = await this.client
        .from('content')
        .insert([{
          date: content.date,
          description: content.description,
          classroomId: content.classroomId,
          teacherId: content.teacherId,
        }])
        .select()
        .single()

      if (contentError) {
        throw new Error(`Erro ao inserir conteúdo: ${contentError}`)
      }

      const contentId = contentData.id

      // Após inserir conteúdo inicia o insert no relacionamento many-to-many para [conteudo_disciplina]
      const { error: disciplineError } = await this.client
        .from('content_discipline')
        .insert(content.disciplines.map(disciplineId => ({
          contentId,
          disciplineId,
        })))

      if (disciplineError) {
        throw new Error(`Erro ao inserir disciplinas: ${disciplineError.message}`)
      }

      // Então inicia o insert no relacionamento many-to-many para [conteudo_bncc]
      const { error: bnccError } = await this.client
        .from('content_bncc')
        .insert(content.bnccs.map(bnccId => ({
          contentId,
          bnccId,
        })))

      if (bnccError) {
        throw new Error(`Erro ao inserir BNCCs: ${bnccError.message}`)
      }

      return contentData
    }
    catch (contentError) {
      throw new Error(`Erro ao inserir conteúdo: ${contentError}`)
    }
  }

  // WIP: Precisa testar integração com o fonte, é provavel estar incorreto este serviço
  async updateContent(content: { id: string, date: string, description: string, classroomId: string, teacherId: string, disciplines: string[], bnccs: string[] }) {
    try {
      // Atualiza primeiro o conteúdo
      const { data: contentData, error: contentError } = await this.client
        .from('content')
        .update([{
          id: content.id,
          date: content.date,
          description: content.description,
          classroomId: content.classroomId,
          teacherId: content.teacherId,
          updatedBy: content.teacherId,
          updatedAt: new Date().toISOString(),
        }])
        .select()
        .single()

      if (contentError) {
        throw new Error(`Erro ao inserir conteúdo: ${contentError}`)
      }

      const contentId = contentData.id

      // Após atualizar conteúdo inicia o update no relacionamento many-to-many para [conteudo_disciplina]
      const { error: disciplineError } = await this.client
        .from('content_discipline')
        .update(content.disciplines.map(disciplineId => ({
          contentId,
          disciplineId,
        })))

      if (disciplineError) {
        throw new Error(`Erro ao inserir disciplinas: ${disciplineError.message}`)
      }

      // Então inicia o update no relacionamento many-to-many para [conteudo_bncc]
      const { error: bnccError } = await this.client
        .from('content_bncc')
        .update(content.bnccs.map(bnccId => ({
          contentId,
          bnccId,
        })))

      if (bnccError) {
        throw new Error(`Erro ao inserir BNCCs: ${bnccError.message}`)
      }

      return contentData
    }
    catch (contentError) {
      throw new Error(`Erro ao inserir conteúdo: ${contentError}`)
    }
  }

  // WIP: Soft delete baseado no BaseService.ts
  async softDeleteContent(content: { id: string, userId: string }) {
    try {
      // "Apaga" somente o conteúdo, ignora os relacionamentos many-to-many cpm soft delete
      const { data, error } = await this.client
        .from('content')
        .update([{
          deletedAt: new Date().toISOString(),
          updatedBy: content.userId,
        }])
        .eq('id', content.id)
      // .select() // checar necessidade
      // .single() // checar necessidade

      if (error) {
        throw new Error(`Erro ao apagar conteúdo: ${error.message}`)
      }

      return data
    }
    catch (error) {
      throw new Error(`Erro ao apagar conteúdo: ${error}`)
    }
  }
}
