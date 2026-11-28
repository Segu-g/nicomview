import { Box, Checkbox, FormControlLabel, TextField, Typography } from '@mui/material'
import { toggleEvent } from '../eventFilter'
import { EVENT_LABELS } from '../eventLabels'
import { TEMPLATE_PLACEHOLDERS } from '../tts/formatter'
import { ALL_EVENT_TYPES, type CommentEventType, type TtsAdapterParamOption } from '../types'
import { SpeakerSelect } from './SpeakerSelect'

type SpeakerValue = string | number

interface TtsEventFieldsProps {
  enabledEvents: CommentEventType[]
  onEnabledEventsChange: (events: CommentEventType[]) => void
  templates: Partial<Record<CommentEventType, string>>
  onTemplateChange: (eventType: CommentEventType, template: string) => void
  /** 空欄時に薄く表示する文字（空欄を既定値として扱う場合に使う） */
  templatePlaceholders?: Partial<Record<CommentEventType, string>>
  /** イベント別の話者。未設定・空文字は既定の話者 */
  speakerOverrides: Partial<Record<CommentEventType, SpeakerValue>>
  /** 空文字は「既定の話者に戻す」 */
  onSpeakerOverrideChange: (eventType: CommentEventType, value: SpeakerValue) => void
  /** 空なら話者欄を出さない */
  speakerOptions: TtsAdapterParamOption[]
  speakerLabel: string
}

/** 読み上げ対象イベントと、イベントごとのテンプレート・話者 */
export function TtsEventFields(props: TtsEventFieldsProps): JSX.Element {
  const { enabledEvents, templates, speakerOverrides, speakerOptions } = props
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        読み上げ対象イベント
      </Typography>
      {ALL_EVENT_TYPES.map((eventType) => {
        const enabled = enabledEvents.includes(eventType)
        const label = EVENT_LABELS[eventType]
        return (
          <Box key={eventType}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={enabled}
                  onChange={(e) =>
                    props.onEnabledEventsChange(toggleEvent(enabledEvents, eventType, e.target.checked))
                  }
                />
              }
              label={label}
            />
            {enabled && (
              <Box sx={{ pl: 4, mb: 1 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={`${label}テンプレート`}
                  value={templates[eventType] ?? ''}
                  placeholder={props.templatePlaceholders?.[eventType]}
                  slotProps={props.templatePlaceholders ? { inputLabel: { shrink: true } } : undefined}
                  helperText={`使用可能: ${TEMPLATE_PLACEHOLDERS[eventType]}`}
                  onChange={(e) => props.onTemplateChange(eventType, e.target.value)}
                  sx={{ mb: 1 }}
                />
                {speakerOptions.length > 0 && (
                  <SpeakerSelect
                    label={`${label}${props.speakerLabel}`}
                    value={speakerOverrides[eventType] ?? ''}
                    options={speakerOptions}
                    emptyLabel="デフォルト"
                    onChange={(value) => props.onSpeakerOverrideChange(eventType, value)}
                  />
                )}
              </Box>
            )}
          </Box>
        )
      })}
    </Box>
  )
}
