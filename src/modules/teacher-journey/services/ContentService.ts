import BaseService from "@/services/BaseService";
import type { Content } from "@prisma/client";
import { formatISO } from "date-fns"

const table = "content" as const

export default class ContentService extends BaseService<Content> {
    constructor() {
        super(table);
    }
    async listContentId(teacherId: string) {
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

    async listContentByDate(teacherId: string, date: string) {
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
            classroom:classroomId (name),
            discipline:disciplineId (name)
            `)
            .eq("teacherId", teacherId)
            .gte("date", formatISO(startOfDay))
            .lte("date", formatISO(endOfDay))
            .order("date" as "asc");

        if (error) {
            throw new Error(`Erro ao encontrar conteúdo: ${error.message}`);
        }
        if (!data || data.length === 0) {
            throw new Error("Nenhum conteúdo encontrado");
        }

        const contentMap = new Map<string, { date: string; content: string[] }>()
        return data;
    }
}