
import { WizardShell } from '../components/wizard/WizardShell'

interface Props {
  onComplete: () => void
}

export function WizardPage({ onComplete }: Props) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">School Timetable Generator</h1>
        <p className="text-gray-500 mt-1">
          Configure your schedule, topics, and teachers to generate an optimized timetable.
        </p>
      </div>
      <WizardShell onComplete={onComplete} />
    </div>
  )
}
