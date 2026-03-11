import { useWizardStore } from '../store/wizardStore'
import { WizardShell } from '../components/wizard/WizardShell'
import { getDefaultData } from '../lib/defaultData'

interface Props {
  onComplete: () => void
}

export function WizardPage({ onComplete }: Props) {
  const { setSchedule, setWeekday, addTopic, addTeacher, reset } = useWizardStore()

  const loadSampleData = () => {
    const data = getDefaultData()
    reset()
    // Apply schedule fields (excluding weekdays, handled separately)
    setSchedule({
      numRooms: data.schedule.numRooms,
      startDate: data.schedule.startDate,
      endDate: data.schedule.endDate,
      maxSessionsPerDayPerTeacher: data.schedule.maxSessionsPerDayPerTeacher,
    })
    data.schedule.weekdays.forEach((wc, i) => setWeekday(i, wc))
    data.topics.forEach((t) => addTopic(t))
    data.teachers.forEach((t) => addTeacher(t))
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">School Timetable Generator</h1>
          <p className="text-gray-500 mt-1">
            Configure your schedule, topics, and teachers to generate an optimized timetable.
          </p>
        </div>
        <button
          type="button"
          onClick={loadSampleData}
          className="text-sm text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-1.5 cursor-pointer transition-colors whitespace-nowrap"
        >
          Load sample data
        </button>
      </div>
      <WizardShell onComplete={onComplete} />
    </div>
  )
}
