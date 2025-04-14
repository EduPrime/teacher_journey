import BaseService from "@/services/BaseService"
import type { Teacher } from "@prisma/client"
import errorHandler from "@/utils/error-handler"

const table = "teacher" as const;

export default class TeacherService extends BaseService<Teacher> {
    constructor() {
        super(table)
    }
    async listTeacherId(userId: string) {
        const { data, error } = await this.client
            .from(table)
            .select("id")
            .eq("userId", userId)

        if (error) {
            errorHandler(error, "Erro ao buscar professor")
        }
        if (!data) {
            throw new Error("Nenhuma professor encontrado")
        }

        return data[0]
    }
}