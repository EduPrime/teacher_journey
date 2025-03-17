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
    id?: string;
    date: Date;
    presence: boolean;
    teacherId: string;
    studentId: string;
    classroomId: string;
    enrollmentId: string;
    disciplineId?: string;
    justificationId: string;
    stageId: string;
    schoolId: string;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date | null;
    updatedBy?: string;
    tenantId?: string;
    frequencies: Frequency[];
}

export interface teacherAttendance {
    id?: string;
    date: Date;
    totalClasses: number;
    AttendanceType: string;
    teacherId: string;
    classroomId: string;
    disciplineId?: string;
    stageId: string;
    schoolId: string;
    updatedAt?: Date;
    updatedBy?: string;
    createdAt?: Date;
    deletedAt?: Date | null;
    tenantId?: string;
}