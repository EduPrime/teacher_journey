// import type { Attendance } from '@prisma/client'
export interface Frequency {
    name: string;
    absence: boolean;
}

export interface FrequencyToSave {
    name: string;
    classroomId: string;
    studentId: string;
    status: string;
    situation: string;
    enrollmentCode: string;
    disability: string;
    date: Date;
    presence: boolean;
    justification?: string;
    frequencies: Frequency[];
}

export interface AttendanceWithFrequencies {
    date: Date;
    presence: boolean;
    studentId: string;
    classroomId: string;
    enrollmentId: string;
    justificationId: string;
    stageId: string;
    schoolId: string;
    frequencies: Frequency[];
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    updatedBy?: string;
    tenantId?: string;
    disciplineId?: string;
}