import type { TtsAdapterParamOption } from '../types'

const SPEAKERS_TIMEOUT_MS = 5000

export interface VoicevoxSpeaker {
  name: string
  styles: { id: number; name: string }[]
}

export async function synthesize(
  text: string,
  speaker: number,
  speed: number,
  volume: number,
  baseUrl: string
): Promise<ArrayBuffer> {
  const queryRes = await fetch(
    `${baseUrl}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`,
    { method: 'POST' }
  )
  if (!queryRes.ok) {
    throw new Error(`audio_query failed: ${queryRes.status}`)
  }
  const query = (await queryRes.json()) as Record<string, unknown>
  query.speedScale = speed
  query.volumeScale = volume

  const synthRes = await fetch(`${baseUrl}/synthesis?speaker=${speaker}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query)
  })
  if (!synthRes.ok) {
    throw new Error(`synthesis failed: ${synthRes.status}`)
  }
  return synthRes.arrayBuffer()
}

export async function fetchSpeakerOptions(baseUrl: string): Promise<TtsAdapterParamOption[]> {
  const res = await fetch(`${baseUrl}/speakers`, { signal: AbortSignal.timeout(SPEAKERS_TIMEOUT_MS) })
  if (!res.ok) {
    throw new Error(`speakers failed: ${res.status}`)
  }
  const speakers = (await res.json()) as VoicevoxSpeaker[]
  return speakers.flatMap((speaker) =>
    speaker.styles.map((style) => ({ value: style.id, label: `${speaker.name} (${style.name})` }))
  )
}
