import type { Content } from '@prisma/client'
import BaseService from '@/services/BaseService'

const table = 'content' as const

export default class ContentService extends BaseService<Content> {
  constructor() {
    super(table)
  }

  // async listContentTeacherId(teacherId: string) {
  //   const { data, error } = await this.client
  //     .from('content')
  //     .select('*')
  //     .eq('teacherId', teacherId)

  //   if (error) {
  //     throw new Error(`Erro ao encontrar conteúdo: ${error.message}`)
  //   }
  //   return data
  // }

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
        disciplines: contentdiscipline (disciplineId (id, name)),
        bnccs: contentbncc (bnccId (id, code, objective))
        `)
      .eq('date', date)
      .eq('classroomId', classroomId)
      .is('deletedAt', null)
    // .eq('teacherId', teacherId) // @TODO: teacherId não é util para ser um parametro do filtro ( pode ser que o professor mude durante o decorrer do ano )

    if (error) {
      throw new Error(`Erro ao encontrar conteúdo: ${error.message}`)
    }
    if (!data || data.length === 0) {
      throw new Error('Nenhum conteúdo encontrado')
    }

    const contentMap = data.map((item: any) => ({
      id: item.id,
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
        .from('contentdiscipline')
        .insert(content.disciplines.map(disciplineId => ({
          contentId,
          disciplineId,
        })))

      if (disciplineError) {
        throw new Error(`Erro ao inserir disciplinas: ${disciplineError.message}`)
      }

      // Então inicia o insert no relacionamento many-to-many para [conteudo_bncc]
      const { error: bnccError } = await this.client
        .from('contentbncc')
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
  // async updateContent(content: { id: string, date: string, description: string, classroomId: string, teacherId: string, disciplines: string[], bnccs: string[] }) {
  //   try {
  //     // Atualiza primeiro o conteúdo
  //     const { data: contentData, error: contentError } = await this.client
  //       .from('content')
  //       .update([{
  //         id: content.id,
  //         date: content.date,
  //         description: content.description,
  //         classroomId: content.classroomId,
  //         teacherId: content.teacherId,
  //         updatedBy: content.teacherId,
  //         updatedAt: new Date().toISOString(),
  //       }])
  //       .select()
  //       .single()

  //     if (contentError) {
  //       throw new Error(`Erro ao atualizar conteúdo: ${contentError}`)
  //     }

  //     const contentId = contentData.id

  //     // Após atualizar conteúdo inicia o update no relacionamento many-to-many para [conteudo_disciplina]
  //     const { error: disciplineError } = await this.client
  //       .from('contentdiscipline')
  //       .update(content.disciplines.map(disciplineId => ({
  //         contentId,
  //         disciplineId,
  //       })))

  //     if (disciplineError) {
  //       throw new Error(`Erro ao inserir disciplinas: ${disciplineError.message}`)
  //     }

  //     // Então inicia o update no relacionamento many-to-many para [conteudo_bncc]
  //     const { error: bnccError } = await this.client
  //       .from('contentbncc')
  //       .update(content.bnccs.map(bnccId => ({
  //         contentId,
  //         bnccId,
  //       })))

  //     if (bnccError) {
  //       throw new Error(`Erro ao inserir BNCCs: ${bnccError.message}`)
  //     }

  //     return contentData
  //   }
  //   catch (contentError) {
  //     throw new Error(`Erro ao atualizar: ${contentError}`)
  //   }
  // }

  // Testando Service
  async updateContent(content: { id: string, date: string, description: string, classroomId: string, teacherId: string, disciplines: string[], bnccs: string[] }) {
    try {
      // Obter os dados atuais do conteúdo
      const { data: currentContent, error: currentContentError } = await this.client
        .from('content')
        .select(`
          *,
          contentdiscipline (disciplineId),
          contentbncc (bnccId)
        `)
        .eq('id', content.id)
        .is('deletedAt', null)
        .single()

      if (currentContentError) {
        throw new Error(`Erro ao obter conteúdo atual: ${currentContentError.message}`)
      }

      // Construir o objeto de atualização com apenas os campos modificados
      const updatedFields: any = {}
      if (currentContent.date !== content.date)
        updatedFields.date = content.date
      if (currentContent.description !== content.description)
        updatedFields.description = content.description
      if (currentContent.classroomId !== content.classroomId)
        updatedFields.classroomId = content.classroomId
      if (currentContent.teacherId !== content.teacherId)
        updatedFields.teacherId = content.teacherId

      // Adicionar campos de auditoria
      updatedFields.updatedBy = content.teacherId
      updatedFields.updatedAt = new Date().toISOString()

      // Atualizar o conteúdo se houver campos modificados
      let contentData
      if (Object.keys(updatedFields).length > 0) {
        const { data, error: contentError } = await this.client
          .from('content')
          .update(updatedFields)
          .eq('id', content.id)
          .select()
          .single()

        if (contentError) {
          throw new Error(`Erro ao atualizar conteúdo: ${contentError.message}`)
        }

        contentData = data
      }
      else {
        contentData = currentContent
      }

      const contentId = contentData.id

      // Verificar se houve mudanças nas disciplines
      const currentDisciplines = currentContent.contentdiscipline.map((d: any) => d.disciplineId)
      const disciplinesChanged = JSON.stringify(currentDisciplines.sort()) !== JSON.stringify(content.disciplines.sort())

      if (disciplinesChanged) {
        // Atualizar o relacionamento many-to-many para [conteudo_disciplina]
        const { error: disciplineError } = await this.client
          .from('contentdiscipline')
          .delete()
          .eq('contentId', contentId)
          .in('disciplineId', currentDisciplines)

        if (disciplineError) {
          throw new Error(`Erro ao remover disciplinas antigas: ${disciplineError.message}`)
        }

        const { error: newDisciplineError } = await this.client
          .from('contentdiscipline')
          .insert(content.disciplines.map(disciplineId => ({
            contentId,
            disciplineId,
          })))

        if (newDisciplineError) {
          throw new Error(`Erro ao inserir disciplinas: ${newDisciplineError.message}`)
        }
      }

      // Verificar se houve mudanças nas bnccs
      const currentBnccs = currentContent.contentbncc.map((b: any) => b.bnccId)
      const bnccsChanged = JSON.stringify(currentBnccs.sort()) !== JSON.stringify(content.bnccs.sort())

      if (bnccsChanged) {
        // Atualizar o relacionamento many-to-many para [conteudo_bncc]
        const { error: bnccError } = await this.client
          .from('contentbncc')
          .delete()
          .eq('contentId', contentId)
          .in('bnccId', currentBnccs)

        if (bnccError) {
          throw new Error(`Erro ao remover BNCCs antigas: ${bnccError.message}`)
        }

        const { error: newBnccError } = await this.client
          .from('contentbncc')
          .insert(content.bnccs.map(bnccId => ({
            contentId,
            bnccId,
          })))

        if (newBnccError) {
          throw new Error(`Erro ao inserir BNCCs: ${newBnccError.message}`)
        }
      }

      return contentData
    }
    catch (contentError) {
      throw new Error(`Erro ao atualizar: ${contentError}`)
    }
  }

  // WIP: Soft delete baseado no BaseService.ts
  async softDeleteContent(content: { id: string, userId: string }) {
    try {
      // Exclusão rasa de conteúdo
      const { data, error } = await this.client
        .from('content')
        .update({
          deletedAt: new Date().toISOString(),
          updatedBy: content.userId,
        })
        .eq('id', content.id)

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
