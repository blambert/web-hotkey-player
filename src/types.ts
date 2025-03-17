export interface AudioFile {
  id: string
  name: string
  src: string
  duration: number
  volume: number
  type: 'audio/mpeg' | 'audio/wav' | string
  trimHead: number
  trimTail: number
}

export interface HotKey {
  id: string
  bankId: number
  position: number
  assignedItem: AssignedItem | null
}

export type AssignedItem = {
  id: string
  type: 'audio' | 'playlist'
}

export interface Playlist {
  id: string
  name: string
  items: Array<{
    audioId: string
    id: string
  }>
  playbackMode: 'manual' | 'follow-on'
}

export interface PlaybackStatus {
  isPlaying: boolean
  currentItem: {
    id: string
    type: 'audio' | 'playlist'
  } | null
  currentAudioId: string | null
  elapsedTime: number
  currentPlaylistId: string | null
  currentPlaylistIndex: number
  loop: boolean
}

export interface DragItem {
  type: 'audio' | 'playlist' | 'playlistItem'
  id: string
  index?: number
  sourceContainerId?: string
}
