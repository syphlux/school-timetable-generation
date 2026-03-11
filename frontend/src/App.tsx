import { useState } from 'react'
import { ToastProvider } from './components/ui/toast'
import { WizardPage } from './pages/WizardPage'
import { TimetablePage } from './pages/TimetablePage'

type Page = 'wizard' | 'timetable'

export default function App() {
  const [page, setPage] = useState<Page>('wizard')

  return (
    <ToastProvider>
      {page === 'wizard' && <WizardPage onComplete={() => setPage('timetable')} />}
      {page === 'timetable' && <TimetablePage onBack={() => setPage('wizard')} />}
    </ToastProvider>
  )
}
