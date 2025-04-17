import type { Series } from '@prisma/client'
import BaseService from '@/services/BaseService'
import errorHandler from '@/utils/error-handler'

const table = 'series' as const // Modifique para sua tabela

export default class SeriesService extends BaseService<Series> {
    constructor() {
        super(table) // Passando o nome da tabela para a classe base
    }

    async listSeriesAndSchools(classes: string[]) {
        const { data, error } = await this.client
            .from('classroom')
            .select('*, series:seriesId (name), school:schoolId (name)')
            .in('id', classes)

        if (error) {
            errorHandler(error, 'Erro ao trazer as séries e escolas')}
        if (!data) {
            throw new Error('Nenhuma nota encontrada')
        }

        const schoolMap = new Map<string, { school: string, series: string[] }>()

        data.forEach((item) => {
            const schoolName = item.school?.name
            const seriesName = item.series?.name

            if (schoolName && seriesName) {
                if (!schoolMap.has(schoolName)) {
                    schoolMap.set(schoolName, { school: schoolName, series: [] })
                }

                const schoolEntry = schoolMap.get(schoolName)
                if (schoolEntry && !schoolEntry.series.includes(seriesName)) {
                    schoolEntry.series.push(seriesName)
                }
            }
        })
        return Array.from(schoolMap.values())
    }
}
