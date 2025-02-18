import BaseService from "@/services/BaseService";
import type { Teacher } from "@prisma/client";

const table = "teacher" as const;

export default class TeacherService extends BaseService<Teacher> {
    constructor() {
        super(table);
    }
    async listTeacherId(userId: string) {
        const { data, error } = await this.client
            .from("teacher")
            .select("id")
            .eq("userId", userId);

        if (error) {
            throw new Error(`Erro ao encontrar professor: ${error.message}`);
        }
        if (!data) {
            throw new Error("Nenhuma professor encontrado");
        }

        return data[0];
    }
}