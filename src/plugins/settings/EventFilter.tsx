import { toggleEvent } from '../../shared/eventFilter'
import { EVENT_LABELS } from '../../shared/eventLabels'
import { ALL_EVENT_TYPES, type CommentEventType } from '../../shared/types'

interface EventFilterProps {
  value: CommentEventType[]
  onChange: (events: CommentEventType[]) => void
}

export function EventFilter({ value, onChange }: EventFilterProps): JSX.Element {
  return (
    <fieldset className="event-filter">
      <legend>表示イベント</legend>
      {ALL_EVENT_TYPES.map((type) => (
        <label key={type}>
          <input
            type="checkbox"
            checked={value.includes(type)}
            onChange={(e) => onChange(toggleEvent(value, type, e.target.checked))}
          />
          {EVENT_LABELS[type]}
        </label>
      ))}
    </fieldset>
  )
}
