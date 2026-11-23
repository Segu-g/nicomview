import { useId } from 'react'
import { Box, MenuItem, Select, Typography } from '@mui/material'
import type { TtsAdapterParamOption } from '../types'

interface SpeakerSelectProps {
  label: string
  value: string | number
  options: TtsAdapterParamOption[]
  onChange: (value: string | number) => void
  /** 指定すると「未選択」（値は空文字）の項目を先頭に出す */
  emptyLabel?: string
}

export function SpeakerSelect({ label, value, options, onChange, emptyLabel }: SpeakerSelectProps): JSX.Element {
  const labelId = useId()
  const isEmpty = value === '' && emptyLabel !== undefined
  const isUnknown = !isEmpty && !options.some((opt) => opt.value === value)

  return (
    <Box>
      <Typography id={labelId} variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Select
        fullWidth
        size="small"
        labelId={labelId}
        value={value}
        displayEmpty={isEmpty}
        onChange={(e) => onChange(e.target.value)}
      >
        {emptyLabel !== undefined && <MenuItem value="">{emptyLabel}</MenuItem>}
        {isUnknown && <MenuItem value={value}>ID: {value}</MenuItem>}
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </Select>
    </Box>
  )
}
