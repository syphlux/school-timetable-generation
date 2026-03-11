import { z } from 'zod'

export const dayBreakSchema = z.object({
  startMinute: z.number().min(0).max(1440),
  endMinute: z.number().min(0).max(1440),
})

export const weekdayConfigSchema = z.object({
  weekday: z.number().min(0).max(6),
  enabled: z.boolean(),
  openMinute: z.number().min(0).max(1440),
  closeMinute: z.number().min(0).max(1440),
  breaks: z.array(dayBreakSchema).max(2),
})

export const scheduleConfigSchema = z.object({
  numRooms: z.number().min(1).max(20),
  weekdays: z.array(weekdayConfigSchema).length(7),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maxSessionsPerDayPerTeacher: z.number().min(1).max(10),
})

export const topicSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  durationMinutes: z.number().min(15).multipleOf(15),
  numSessions: z.number().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
})

export const teacherSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  topicIds: z.array(z.string()),
  unavailableDates: z.array(z.string()),
})
