import { useState } from 'react'
import { Box, Slider, Typography } from '@mui/material'
import { TTS_SPEED_RANGE, TTS_VOLUME_RANGE, type NumberRange } from '../constants'

interface LevelSliderProps {
  label: string
  range: NumberRange
  value: number
  onCommit: (value: number) => void
}

/** ドラッグ中は表示だけ更新し、確定時に通知する */
function LevelSlider({ label, range, value, onCommit }: LevelSliderProps): JSX.Element {
  const [draft, setDraft] = useState<number | null>(null)
  const shown = draft ?? value
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {label}: {shown.toFixed(1)}
      </Typography>
      <Slider
        size="small"
        {...range}
        aria-label={label}
        value={shown}
        onChange={(_e, v) => setDraft(v as number)}
        onChangeCommitted={(_e, v) => {
          setDraft(null)
          onCommit(v as number)
        }}
      />
    </Box>
  )
}

interface SpeedVolumeFieldsProps {
  speed: number
  volume: number
  onSpeedChange: (value: number) => void
  onVolumeChange: (value: number) => void
}

export function SpeedVolumeFields({ speed, volume, onSpeedChange, onVolumeChange }: SpeedVolumeFieldsProps): JSX.Element {
  return (
    <>
      <LevelSlider label="速度" range={TTS_SPEED_RANGE} value={speed} onCommit={onSpeedChange} />
      <LevelSlider label="音量" range={TTS_VOLUME_RANGE} value={volume} onCommit={onVolumeChange} />
    </>
  )
}
