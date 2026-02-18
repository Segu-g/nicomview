import { FormGroup, FormControlLabel, Checkbox } from '@mui/material'
import type { CommentEventType, PluginPreferences } from '../../../shared/types'
import { ALL_EVENT_TYPES } from '../../../shared/types'

interface EventFilterProps {
  preferences: PluginPreferences
  onPreferencesChange: (prefs: Partial<PluginPreferences>) => void
}

const eventLabels: Record<CommentEventType, string> = {
  comment: 'コメント',
  gift: 'ギフト',
  emotion: 'エモーション',
  notification: '通知',
  operatorComment: '運営コメント'
}

export default function EventFilter({
  preferences,
  onPreferencesChange
}: EventFilterProps): JSX.Element {
  const handleToggle = (eventType: CommentEventType, checked: boolean) => {
    const current = preferences.enabledEvents
    const next = checked
      ? [...current, eventType]
      : current.filter((t) => t !== eventType)
    onPreferencesChange({ enabledEvents: next })
  }

  return (
    <FormGroup row>
      {ALL_EVENT_TYPES.map((eventType) => (
        <FormControlLabel
          key={eventType}
          control={
            <Checkbox
              size="small"
              checked={preferences.enabledEvents.includes(eventType)}
              onChange={(e) => handleToggle(eventType, e.target.checked)}
            />
          }
          label={eventLabels[eventType]}
        />
      ))}
    </FormGroup>
  )
}
