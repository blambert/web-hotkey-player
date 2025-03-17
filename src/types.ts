// Audio file type
export interface AudioFile {
  id: string
  name: string
  src: string
  duration: number
  volume: number
  type: string
  trimHead?: number
  trimTail?: number
}

// Playlist item type
export interface PlaylistItem {
  id: string
  audioId: string
}

// Playlist type
export interface Playlist {
  id: string
  name: string
  items: PlaylistItem[]
  playbackMode: 'follow-on' // Removed 'manual' option
}

// Playback status type
export interface PlaybackStatus {
  isPlaying: boolean
  currentItem: AssignedItem | null
  currentAudioId: string | null
  elapsedTime: number
  currentPlaylistId: string | null
  currentPlaylistIndex: number
  loop: boolean
}

// Assigned item type (for hotkeys)
export interface AssignedItem {
  type: 'audio' | 'playlist'
  id: string
}

// Hotkey type
export interface HotKey {
  id: string
  bankId: number
  position: number
  assignedItem: AssignedItem | null
}

// Draggable item type
export interface DraggableItem {
  id: string
  type: string
}

// App state type
export interface AppState {
  currentBank: number
  playbackStatus: {
    loop: boolean
  }
}
