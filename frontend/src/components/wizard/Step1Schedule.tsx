
import { useWizardStore } from '../../store/wizardStore'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { DateRangePicker } from '../shared/DateRangePicker'
import { TimeRangePicker } from '../shared/TimeRangePicker'
import { BreakEditor } from '../shared/BreakEditor'

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Step1Schedule() {
  const { schedule, setSchedule, setWeekday } = useWizardStore()

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Schedule Configuration</h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Number of rooms</Label>
          <Input
            type="number"
            min={1}
            max={20}
            value={schedule.numRooms}
            onChange={(e) => setSchedule({ numRooms: parseInt(e.target.value) || 1 })}
          />
        </div>
        <div className="space-y-1">
          <Label>Max sessions / teacher / day</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={schedule.maxSessionsPerDayPerTeacher}
            onChange={(e) => setSchedule({ maxSessionsPerDayPerTeacher: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      <DateRangePicker
        startDate={schedule.startDate}
        endDate={schedule.endDate}
        onChangeStart={(d) => setSchedule({ startDate: d })}
        onChangeEnd={(d) => setSchedule({ endDate: d })}
      />

      <div className="space-y-3">
        <Label>Weekday settings</Label>
        {schedule.weekdays.map((wc, i) => (
          <div
            key={i}
            className={`border rounded-lg p-3 ${wc.enabled ? 'border-blue-200 bg-blue-50' : 'bg-gray-50'}`}
          >
            <div className="flex items-center gap-3 mb-2">
              <input
                type="checkbox"
                id={`wd-${i}`}
                checked={wc.enabled}
                onChange={(e) => setWeekday(i, { enabled: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor={`wd-${i}`} className="font-medium text-sm cursor-pointer w-10">
                {WEEKDAY_NAMES[i]}
              </label>
              {wc.enabled && (
                <TimeRangePicker
                  startMinute={wc.openMinute}
                  endMinute={wc.closeMinute}
                  onChangeStart={(m) => setWeekday(i, { openMinute: m })}
                  onChangeEnd={(m) => setWeekday(i, { closeMinute: m })}
                />
              )}
            </div>
            {wc.enabled && (
              <div className="ml-7">
                <BreakEditor
                  breaks={wc.breaks}
                  onChange={(breaks) => setWeekday(i, { breaks })}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
