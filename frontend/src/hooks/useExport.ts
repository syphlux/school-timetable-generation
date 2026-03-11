import type { RefObject } from 'react'
import type { SolvedSession, WizardData } from '../types'
import { minutesToTime } from '../lib/utils'

export function useExport(timetableRef: RefObject<HTMLDivElement | null>) {
  const exportJSON = (wizardData: WizardData, sessions: SolvedSession[]) => {
    const data = { input: wizardData, sessions }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    download(blob, 'timetable.json')
  }

  const exportCSV = (sessions: SolvedSession[]) => {
    const header = 'session_id,topic,session_index,date,start,end,room,teacher'
    const rows = sessions.map((s) =>
      [
        s.sessionId,
        `"${s.topicName}"`,
        s.sessionIndex + 1,
        s.date,
        minutesToTime(s.startMinute),
        minutesToTime(s.endMinute),
        s.roomIndex + 1,
        `"${s.teacherName}"`,
      ].join(',')
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    download(blob, 'timetable.csv')
  }

  const exportPNG = async () => {
    if (!timetableRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const el = timetableRef.current
    const prevOverflow = el.style.overflow
    el.style.overflow = 'visible'
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true })
      canvas.toBlob((blob) => {
        if (blob) download(blob, 'timetable.png')
      })
    } finally {
      el.style.overflow = prevOverflow
    }
  }

  return { exportJSON, exportCSV, exportPNG }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
