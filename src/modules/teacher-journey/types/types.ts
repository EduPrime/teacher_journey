import type { Decimal } from '@prisma/client/runtime/library'

// import type { Attendance } from '@prisma/client'
export interface Frequency {
  name: string
  absent: boolean
}

export interface Thematics {
  id?: string
  name: string
  seriesId: string
  disciplineId: string
}

export interface FrequencyToSave {
  name: string
  classroomId: string
  studentId: string
  teacherId: string
  disciplineId?: string
  status: string
  stageId: string
  schoolId: string
  situation: string
  enrollmentId: string
  disability: string
  date: Date
  presence: boolean
  justificationId?: string
  frequencies: Frequency[]
}

export interface NumericToSave {
  classroomId: string
  disciplineId: string
  enrollmentId: string
  studentId: string
  stageId: string
  schoolId: string
  at1: Decimal
  at2: Decimal
  at3: Decimal
  at4: Decimal
  at5: Decimal
  makeUp: Decimal
  grade: Decimal
}

export interface ConceptualToSave {
  studentId: string
  enrollmentId: string
  classroomId: string
  disciplineId: string
  schoolId: string
  stageId: string
  thematics?: Thematics[]
}

export interface MountedStudent {
  name: string
  classroomId: string
  studentId: string
  teacherId: string
  disciplineId?: string
  status: string
  stageId: string
  schoolId: string
  situation: string
  enrollmentId: string
  disability: string
}

export interface AttendanceWithFrequencies {
  id?: string
  date: Date
  presence: boolean
  teacherId: string
  studentId: string
  classroomId: string
  enrollmentId: string
  disciplineId?: string
  justificationId?: string
  stageId: string
  schoolId: string
  createdAt?: Date
  updatedAt?: Date
  deletedAt?: Date | null
  updatedBy?: string
  tenantId?: string
  frequencies: Frequency[]
}

export interface TeacherFrequency {
  id?: string
  date: Date
  totalClasses: number
  type: string
  teacherId: string
  classroomId: string
  disciplineId?: string
  stageId: string
  schoolId: string
  updatedAt?: Date
  updatedBy?: string
  createdAt?: Date
  deletedAt?: Date | null
  tenantId?: string
}

export interface Stage {
  id: string
  numberStage: string
  startDate: Date
  endDate: Date
  tenantId: string
  institutionId: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface WarningFrequency {
  teacherId: string
  date: string
  classroomId: string
  disciplineId?: string

}
