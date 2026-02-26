import { readPsd, Layer } from 'ag-psd'

export interface PsdLayer {
  path: string
  name: string
  canvas: HTMLCanvasElement | null
  left: number
  top: number
  opacity: number
  isGroup: boolean
  forceVisible: boolean
  isRadio: boolean
  flipX: boolean
  flipY: boolean
  hidden: boolean
}

export interface PsdData {
  width: number
  height: number
  layers: PsdLayer[]
}

function parseName(raw: string): {
  name: string
  pathName: string
  forceVisible: boolean
  isRadio: boolean
  flipX: boolean
  flipY: boolean
} {
  let name = raw
  let forceVisible = false
  let isRadio = false
  let flipX = false
  let flipY = false

  if (name.startsWith('!')) {
    forceVisible = true
    name = name.slice(1)
  } else if (name.startsWith('*')) {
    isRadio = true
    name = name.slice(1)
  }

  // pathName keeps flip suffix (for unique path), name strips it (for display)
  const pathName = name
  if (name.endsWith(':flipxy')) {
    flipX = true
    flipY = true
    name = name.slice(0, -7)
  } else if (name.endsWith(':flipx')) {
    flipX = true
    name = name.slice(0, -6)
  } else if (name.endsWith(':flipy')) {
    flipY = true
    name = name.slice(0, -6)
  }

  return { name, pathName, forceVisible, isRadio, flipX, flipY }
}

function flattenLayers(layers: Layer[], parentPath: string, parentHidden: boolean): PsdLayer[] {
  const result: PsdLayer[] = []

  for (const layer of layers) {
    const rawName = layer.name ?? ''
    const { name, pathName, forceVisible, isRadio, flipX, flipY } = parseName(rawName)
    const path = parentPath ? `${parentPath}/${pathName}` : pathName
    const isGroup = !!(layer.children && layer.children.length > 0)
    const hidden = parentHidden || !!(layer.hidden)

    result.push({
      path,
      name,
      canvas: layer.canvas ?? null,
      left: layer.left ?? 0,
      top: layer.top ?? 0,
      opacity: layer.opacity ?? 1,
      isGroup,
      forceVisible,
      isRadio,
      flipX,
      flipY,
      hidden,
    })

    if (layer.children) {
      result.push(...flattenLayers(layer.children, path, hidden))
    }
  }

  return result
}

export async function loadPsd(url: string): Promise<PsdData> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch PSD: ${response.status} ${response.statusText}`)
  }
  const buffer = await response.arrayBuffer()
  const psd = readPsd(buffer)

  const layers = psd.children ? flattenLayers(psd.children, '', false) : []

  return {
    width: psd.width,
    height: psd.height,
    layers,
  }
}

export function getLeafLayers(data: PsdData): PsdLayer[] {
  return data.layers.filter((l) => !l.isGroup && l.canvas !== null)
}
