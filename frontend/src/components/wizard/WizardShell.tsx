import { Fragment, useState } from 'react'
import { useWizardStore } from '../../store/wizardStore'
import { useSolver } from '../../hooks/useSolver'
import { Step1Schedule } from './Step1Schedule'
import { Step2Topics } from './Step2Topics'
import { Step3Teachers } from './Step3Teachers'
import { Button } from '../ui/button'
import { useToast } from '../ui/toast'

const STEPS = ['Schedule', 'Topics', 'Teachers']

interface Props {
  onComplete: () => void
}

export function WizardShell({ onComplete }: Props) {
  const [step, setStep] = useState(0)
  const { schedule, topics, teachers } = useWizardStore()
  const { solve, loading, error } = useSolver()
  const { addToast } = useToast()

  const handleSolve = async () => {
    if (topics.length === 0) { addToast('Add at least one topic.', 'error'); return }
    if (teachers.length === 0) { addToast('Add at least one teacher.', 'error'); return }
    const unnamedTopic = topics.find((t) => !t.name.trim())
    if (unnamedTopic) { addToast('All topics must have a name.', 'error'); setStep(1); return }
    const unnamedTeacher = teachers.find((t) => !t.name.trim())
    if (unnamedTeacher) { addToast('All teachers must have a name.', 'error'); setStep(2); return }
    const result = await solve({ schedule, topics, teachers })
    if (result) {
      if (result.status === 'infeasible') {
        addToast('No feasible timetable found. Check your constraints.', 'error')
      } else {
        if (result.warnings.length > 0) {
          addToast(result.warnings[0], 'info')
        }
        onComplete()
      }
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Step indicator */}
      <div className="flex items-center mb-8">
        {STEPS.map((label, i) => (
          <Fragment key={i}>
            <button
              type="button"
              onClick={() => setStep(i)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  i <= step
                    ? 'bg-blue-600 text-white group-hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-sm font-medium transition-colors ${
                i === step ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'
              }`}>
                {label}
              </span>
            </button>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </Fragment>
        ))}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-xl border p-6 shadow-sm">
        {step === 0 && <Step1Schedule />}
        {step === 1 && <Step2Topics />}
        {step === 2 && <Step3Teachers />}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          ← Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Next →
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={handleSolve}
            disabled={loading}
            className="px-8 font-semibold"
          >
            {loading ? 'Solving…' : '✦ Generate Timetable'}
          </Button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
