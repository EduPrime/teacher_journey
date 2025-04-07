import type { NumericGrade } from '@prisma/client'
import type { NumericToSave } from '../types/types'
import BaseService from '@/services/BaseService'

const table = 'numericGrade' as const
export default class NumericGradeSevice extends BaseService<NumericGrade> {
  constructor() {
    super(table)
  }

  async getNumericGrade(classroomId: string, disciplineId: string) {
    const { data, error } = await this.client
      .from(table)
      .select(`*`)
      .eq('classroomId', classroomId)
      .eq('disciplineId', disciplineId)
      .is('deletedAt', null)
    if (error) {
      throw new Error(`Erro listar todas as notas dos alunos: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma nota encontrada')
    }
    return data
  }

  async getNumericGradeByStage(classroomId: string, disciplineId: string, stageId: string) {
    const { data, error } = await this.client
      .from(table)
      .select(`*`)
      .eq('classroomId', classroomId)
      .eq('disciplineId', disciplineId)
      .eq('stageId', stageId)
      .is('deletedAt', null)

    if (error) {
      throw new Error(`Erro ao buscar notas por etapa: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma nota encontrada por etapa')
    }

    return data
  }

  async getNumericGradeByStudent(studentId: string) {
    const { data, error } = await this.client
      .from(table)
      .select(`*`)
      .eq('studentId', studentId)
      .is('deletedAt', null)
    if (error) {
      throw new Error(`Erro listar todas as notas do aluno: ${error.message}`)
    }
    if (!data) {
      throw new Error('Nenhuma nota encontrada para o aluno')
    }
    return data
  }

  async upsertNumericGrade(studentGrades: NumericToSave) {
    try {
      // Adiciona o campo deletedAt = null ao objeto antes de enviar, para evitar erro de conflito caso o professor já tenha apagado alguma nota para o aluno
      const studentGradesWithDeletedAt = {
        ...studentGrades,
        deletedAt: null,
      }
      const { data, error } = await this.client
        .from(table)
        .upsert(studentGradesWithDeletedAt, { onConflict: 'studentId, classroomId, enrollmentId, stageId, disciplineId' })
        .select(`*`)

      if (error) {
        throw new Error(`Erro ao atualizar ou inserir nota: ${error.message}`)
      }

      if (!data || data.length === 0) {
        throw new Error('Nenhuma nota foi atualizada ou inserida')
      }

      return data
    }
    catch (error) {
      throw new Error(`Erro inesperado ao atualizar ou inserir nota: ${(error as Error).message}`)
    }
  }

    /*async upsertNumericGrade(studentGrades: NumericToSave) {
      try {
        const studentGradesWithDeletedAt = {
          ...studentGrades,
          deletedAt: null,
        };
  
        const { data: existing, error: findError } = await this.client
          .from(table)
          .select('id')
          .eq('studentId', studentGrades.studentId)
          .eq('classroomId', studentGrades.classroomId)
          .eq('enrollmentId', studentGrades.enrollmentId)
          .eq('stageId', studentGrades.stageId)
          .eq('disciplineId', studentGrades.disciplineId)
          .is('deletedAt', null)
          .maybeSingle();
  
        if (findError) throw new Error(`Erro ao buscar nota: ${findError.message}`);
  
        if (existing) {
          const { data, error } = await this.client
            .from(table)
            .update(studentGradesWithDeletedAt)
            .eq('id', existing.id)
            .select('*');
  
          if (error) throw new Error(`Erro ao atualizar nota: ${error.message}`);
          return data;
        }
  
        const { data, error } = await this.client
          .from(table)
          .insert(studentGradesWithDeletedAt)
          .select('*');
  
        if (error) throw new Error(`Erro ao inserir nota: ${error.message}`);
        return data;
      } catch (error) {
        throw new Error(`Erro inesperado: ${(error as Error).message}`);
      }
    }*/

  async softDeleteNumericGrade(studentGradesId: string, userId: string) {
    try {
      const { data, error } = await this.client
        .from(table)
        .update({
          deletedAt: new Date().toISOString(),
          updatedBy: userId,
        })
        .eq('id', studentGradesId)

      if (error) {
        throw new Error(`Erro ao tentar apagar notas do aluno: ${error.message}`)
      }

      return data
    }
    catch (error) {
      throw new Error(`Erro inesperado ao apagar notas do aluno: ${error}`)
    }
  }

    /*async deleteNumericGrade(studentGradesId: string) {
      try {
        const { data, error } = await this.client
          .from(table)
          .delete()
          .eq('id', studentGradesId)
    
        if (error) {
          throw new Error(`Erro ao tentar apagar notas do aluno: ${error.message}`)
        }
    
        return data
      } catch (error) {
        throw new Error(`Erro inesperado ao apagar notas do aluno: ${error}`)
      }
    }*/
}
