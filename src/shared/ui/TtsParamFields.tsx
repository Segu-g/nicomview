import { Box, Button, TextField, Typography } from '@mui/material'
import type { TtsAdapterParamDef, TtsAdapterSettings } from '../types'
import { SpeakerSelect } from './SpeakerSelect'

interface TtsParamFieldsProps {
  params: TtsAdapterParamDef[]
  values: TtsAdapterSettings
  onChange: (param: TtsAdapterParamDef, value: string | number) => void
  /** 選択肢の再取得 */
  onRefresh: () => void
}

export function TtsParamFields({ params, values, onChange, onRefresh }: TtsParamFieldsProps): JSX.Element {
  return (
    <>
      {params.map((param) => {
        const raw = values[param.key] ?? param.defaultValue
        const value = typeof raw === 'boolean' ? String(raw) : raw

        if (param.type === 'select') {
          const options = param.options ?? []
          return (
            <Box key={param.key} sx={{ mb: 1 }}>
              {options.length > 0 ? (
                <SpeakerSelect
                  label={param.label}
                  value={value}
                  options={options}
                  onChange={(v) => onChange(param, v)}
                />
              ) : (
                <>
                  <Typography variant="caption" color="text.secondary" component="div">
                    {param.label}（ID: {value}）
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    エンジンに接続できません
                  </Typography>
                  <Button size="small" onClick={onRefresh}>再取得</Button>
                </>
              )}
            </Box>
          )
        }

        const isNumber = param.type === 'number'
        return (
          <Box key={param.key} sx={{ mb: 1 }}>
            <TextField
              fullWidth
              size="small"
              label={param.label}
              type={isNumber ? 'number' : 'text'}
              value={value}
              inputProps={isNumber ? { min: param.min, max: param.max, step: param.step } : undefined}
              onChange={(e) => onChange(param, isNumber ? Number(e.target.value) : e.target.value)}
            />
          </Box>
        )
      })}
    </>
  )
}
