import type { ServerFunction } from '@prisma/client'
import BaseService from '@/services/BaseService'
import errorHandler from '@/utils/error-handler'

interface ServerFunctionToSave {
  id?: string
  name: string
  abbreviation: string
  tenantId?: string | null
  userCreated?: string | null
}

const table = 'serverFunction' as const

export default class ServerFunctionService extends BaseService<ServerFunction> {
  constructor() {
    super(table)
  }

  async getServerFunctions() {
    const { data, error } = await this.client
      .from(table)
      .select('*')
      .is('deletedAt', null)

    if (error) {
      errorHandler(error, 'Erro ao buscar funções de servidor')
    }
    return data as ServerFunction[]
  }

  async getServerFunctionById(id: string) {
    if (!id) {
      return null
    }

    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq('id', id)
      .is('deletedAt', null)
      .maybeSingle()

    if (error) {
      errorHandler(error, 'Erro ao buscar função de servidor por ID')
    }
    return data as ServerFunction | null
  }

  async getServerFunctionByName(name: string) {
    if (!name) {
      return null
    }

    const { data, error } = await this.client
      .from(table)
      .select('*')
      .eq('name', name)
      .is('deletedAt', null)
      .maybeSingle()

    if (error) {
      errorHandler(error, 'Erro ao buscar função de servidor por nome')
    }
    return data as ServerFunction | null
  }

  async upsertServerFunction(serverFunction: ServerFunctionToSave) {
    const now = new Date().toISOString()

    let existing = null
    if (serverFunction.id) {
      const { data, error: fetchError } = await this.client
        .from(table)
        .select('*')
        .eq('id', serverFunction.id)
        .is('deletedAt', null)
        .maybeSingle()

      if (fetchError) errorHandler(fetchError, 'Erro ao buscar função de servidor existente por ID')
      existing = data
    } else if (serverFunction.name) {
      const { data, error: fetchError } = await this.client
        .from(table)
        .select('*')
        .eq('name', serverFunction.name)
        .is('deletedAt', null)
        .maybeSingle()

      if (fetchError) errorHandler(fetchError, 'Erro ao buscar função de servidor existente por nome')
      existing = data
    }

    const payload: Partial<ServerFunction> & { id?: string } = {
      name: serverFunction.name,
      abbreviation: serverFunction.abbreviation,
      tenantId: serverFunction.tenantId || null,
      userCreated: serverFunction.userCreated || null,
      deletedAt: null,
      updatedAt: now,
      ...(existing?.id && { id: existing.id }),
    }

    const { data, error } = await this.client
      .from(table)
      .upsert(payload)
      .select()

    if (error) errorHandler(error, 'Erro ao inserir/atualizar função de servidor')
    return data as ServerFunction[]
  }

  async softDeleteServerFunction(serverFunctionId: string, userId?: string) {
    if (!serverFunctionId) {
      errorHandler({ message: 'ID da função de servidor não fornecido' }, 'Erro ao apagar função de servidor')
      return []
    }

    const now = new Date().toISOString()
    const updateFields: Record<string, any> = {
      deletedAt: now,
      updatedAt: now,
    }

    if (userId) {
      updateFields.updatedBy = userId
    }

    const { data, error } = await this.client
      .from(table)
      .update(updateFields)
      .eq('id', serverFunctionId)
      .is('deletedAt', null)

    if (error) errorHandler(error, 'Erro ao apagar função de servidor')
    return data ?? []
  }
}
