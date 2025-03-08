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
      date: item.date,
      description: item.description,
      disciplines: item.disciplines,
      bnccs: item.bnccs,
    }))
    return contentMap
  }

  async createContent(content: { date: string, description: string, classroomId: string, teacherId: string, disciplines: string[], bnccs: string[] }) {
    try {
      // Inserire primeiro o conteúdo
      const { data: contentData, error: contentError } = await this.client
        .from('content')
        .insert([{
          date: content.date,
          description: content.description,
          classroomId: content.classroomId,
          teacherId: content.teacherId
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
          disciplineId
        })))

      if (disciplineError) {
        throw new Error(`Erro ao inserir disciplinas: ${disciplineError.message}`)
      }

      // Então inicia o insert no relacionamento many-to-many para [conteudo_bncc]
      const { error: bnccError } = await this.client
        .from('content_bncc')
        .insert(content.bnccs.map(bnccId => ({
          contentId,
          bnccId
        })))

      if (bnccError) {
        throw new Error(`Erro ao inserir BNCCs: ${bnccError.message}`)
      }

      return contentData
    } catch (contentError) {
      throw new Error(`Erro ao inserir conteúdo: ${contentError}`)
    }
  }

  async updateContent(content: { date: string, description: string, classroomId: string, teacherId: string, disciplines: string[], bnccs: string[] }) {
    try {
      // Inserire primeiro o conteúdo
      const { data: contentData, error: contentError } = await this.client
        .from('content')
        .update([{
          date: content.date,
          description: content.description,
          classroomId: content.classroomId,
          teacherId: content.teacherId
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
          disciplineId
        })))

      if (disciplineError) {
        throw new Error(`Erro ao inserir disciplinas: ${disciplineError.message}`)
      }

      // Então inicia o insert no relacionamento many-to-many para [conteudo_bncc]
      const { error: bnccError } = await this.client
        .from('content_bncc')
        .insert(content.bnccs.map(bnccId => ({
          contentId,
          bnccId
        })))

      if (bnccError) {
        throw new Error(`Erro ao inserir BNCCs: ${bnccError.message}`)
      }

      // return data
    } catch (contentError) {
      throw new Error(`Erro ao inserir conteúdo: ${contentError}`)
    }
  }

  async softDeleteContent(content: { date: string, description: string, classroomId: string, teacherId: string, disciplines: string[], bnccs: string[] }) {
    try {
      // Inserire primeiro o conteúdo
      const { data: contentData, error: contentError } = await this.client
        .from('content')
        .update([{
          date: content.date,
          description: content.description,
          classroomId: content.classroomId,
          teacherId: content.teacherId
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
          disciplineId
        })))

      if (disciplineError) {
        throw new Error(`Erro ao inserir disciplinas: ${disciplineError.message}`)
      }

      // Então inicia o insert no relacionamento many-to-many para [conteudo_bncc]
      const { error: bnccError } = await this.client
        .from('content_bncc')
        .insert(content.bnccs.map(bnccId => ({
          contentId,
          bnccId
        })))

      if (bnccError) {
        throw new Error(`Erro ao inserir BNCCs: ${bnccError.message}`)
      }

      // return data
    } catch (contentError) {
      throw new Error(`Erro ao inserir conteúdo: ${contentError}`)
    }
  }
}
