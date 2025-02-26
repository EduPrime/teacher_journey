import BaseService from "@/services/BaseService";
import type { Content } from "@prisma/client";
import { formatISO } from "date-fns"

const table = "content" as const

export default class ContentService extends BaseService<Content> {
    constructor() {
        super(table);
    }
    async listContentTeacherId(teacherId: string) {
        const { data, error } = await this.client
            .from("content")
            .select("*")
            .eq("teacherId", teacherId);

        if (error) {
            throw new Error(`Erro ao encontrar conteúdo: ${error.message}`);
        }
        if (!data) {
            throw new Error("Nenhum conteúdo encontrado");
        }

        return data;
    }

    async listContentByToday(teacherId: string, date: string) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data, error } = await this.client
            .from("content")
            .select(`
            id,
            date,
            description,
            classroom: classroomId (name),
            disciplines: content_discipline (disciplineId (id, name)),
            bnccs: content_bncc (bnccId (id, code, objective))
            `)
            .eq("teacherId", teacherId)
            .eq("date", date);
        // .gte("date", formatISO(startOfDay))
        // .lte("date", formatISO(endOfDay))

        console.log("log ", data);

        if (error) {
            throw new Error(`Erro ao encontrar conteúdo: ${error.message}`);
        }
        if (!data || data.length === 0) {
            throw new Error("Nenhum conteúdo encontrado");
        }

        const contentMap = data.map((item: any) => ({
            classroom: item.classroom.name,
            date: item.date,
            description: item.description,
            disciplines: item.disciplines.map((d: any) => d.disciplineId.name),
            bnccs: item.bnccs.map((b: any) => b.bnccId.code)
        }));
        return contentMap;
    }
}