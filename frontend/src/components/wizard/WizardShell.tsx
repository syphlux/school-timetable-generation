import { Fragment, useEffect, useRef, useState } from 'react'
import { useWizardStore } from '../../store/wizardStore'
import { useSolver } from '../../hooks/useSolver'
import type { SolverType } from '../../hooks/useSolver'
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
  const [solverType, setSolverType] = useState<SolverType>('heuristic')
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(30)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { schedule, topics, teachers } = useWizardStore()
  const { solve, loading, error } = useSolver()
  const { addToast } = useToast()

  useEffect(() => {
    if (loading && solverType === 'cpsat') {
      setElapsed(0)
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loading, solverType])

  const handleSolve = async () => {
    if (topics.length === 0) { addToast('Add at least one topic.', 'error'); return }
    if (teachers.length === 0) { addToast('Add at least one teacher.', 'error'); return }
    const unnamedTopic = topics.find((t) => !t.name.trim())
    if (unnamedTopic) { addToast('All topics must have a name.', 'error'); setStep(1); return }
    const unnamedTeacher = teachers.find((t) => !t.name.trim())
    if (unnamedTeacher) { addToast('All teachers must have a name.', 'error'); setStep(2); return }
    const result = await solve({ schedule, topics, teachers }, solverType, timeLimitSeconds)
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
          <div className="flex items-center gap-3">
            {/* Solver toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
              <button
                type="button"
                onClick={() => setSolverType('heuristic')}
                disabled={loading}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${
                  solverType === 'heuristic'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Heuristic
              </button>
              <button
                type="button"
                onClick={() => setSolverType('cpsat')}
                disabled={loading}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${
                  solverType === 'cpsat'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                CP-SAT
              </button>
            </div>

            {/* CP-SAT time limit: input or countdown */}
            {solverType === 'cpsat' && (
              loading ? (
                <div className="flex flex-col gap-1 w-36">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Solving…</span>
                    <span>{Math.max(timeLimitSeconds - elapsed, 0)}s left</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
                      style={{ width: `${Math.min((elapsed / timeLimitSeconds) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-gray-500 whitespace-nowrap">Time limit</label>
                  <input
                    type="number"
                    min={5}
                    max={160}
                    value={timeLimitSeconds}
                    onChange={(e) => setTimeLimitSeconds(Math.min(300, Math.max(5, Number(e.target.value))))}
                    className="w-16 px-2 py-1.5 text-sm border border-gray-300 rounded-md text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-500">s</span>
                </div>
              )
            )}

            <Button
              size="lg"
              onClick={handleSolve}
              disabled={loading}
              className="px-8 font-semibold"
            >
              {loading ? 'Solving…' : '✦ Generate Timetable'}
            </Button>
          </div>
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
