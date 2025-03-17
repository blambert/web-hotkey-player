import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { AudioFile, Playlist, PlaybackStatus, AssignedItem, HotKey } from '../types'

// Default values
const NUM_BANKS = 6
const HOTKEYS_PER_BANK = 24 // 4 rows of 6 buttons

// Audio Player Service - Handles audio playback functionality
class AudioPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private onTimeUpdate: (time: number) => void;
  private onEnded: () => void;
  private tailTrimTimeout: number | null = null;
  public currentTailTrim: number = 0;
  public currentDuration: number = 0;

  constructor(onTimeUpdate: (time: number) => void, onEnded: () => void) {
    this.onTimeUpdate = onTimeUpdate;
    this.onEnded = onEnded;
    this.initialize();
  }

  private initialize() {
    this.audioElement = new Audio();
    
    this.audioElement.addEventListener('timeupdate', () => {
      if (this.audioElement) {
        this.onTimeUpdate(this.audioElement.currentTime);
        
        // Check if we've reached the tail trim point
        if (this.currentTailTrim > 0 && this.audioElement.currentTime >= (this.currentDuration - this.currentTailTrim)) {
          this.stop();
          this.onEnded();
        }
      }
    });
    
    this.audioElement.addEventListener('ended', () => {
      this.onEnded();
    });
  }

  play(src: string, volume: number, startTime: number = 0, tailTrim: number = 0, duration: number = 0) {
    if (!this.audioElement) return;
    
    // Clear any existing timeout
    if (this.tailTrimTimeout !== null) {
      window.clearTimeout(this.tailTrimTimeout);
      this.tailTrimTimeout = null;
    }
    
    this.audioElement.src = src;
    this.audioElement.volume = volume;
    this.audioElement.currentTime = startTime;
    this.currentTailTrim = tailTrim;
    this.currentDuration = duration;
    
    return this.audioElement.play().catch(error => {
      console.error('Failed to play audio:', error);
    });
  }

  pause() {
    if (this.audioElement) {
      this.audioElement.pause();
      
      // Clear any existing timeout
      if (this.tailTrimTimeout !== null) {
        window.clearTimeout(this.tailTrimTimeout);
        this.tailTrimTimeout = null;
      }
    }
  }

  stop() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      
      // Clear any existing timeout
      if (this.tailTrimTimeout !== null) {
        window.clearTimeout(this.tailTrimTimeout);
        this.tailTrimTimeout = null;
      }
    }
  }

  setCurrentTime(time: number) {
    if (this.audioElement) {
      this.audioElement.currentTime = time;
    }
  }

  getCurrentTime() {
    return this.audioElement?.currentTime || 0;
  }

  cleanup() {
    if (this.audioElement) {
      this.audioElement.removeEventListener('timeupdate', () => this.onTimeUpdate);
      this.audioElement.removeEventListener('ended', this.onEnded);
      this.audioElement.pause();
      this.audioElement = null;
    }
    
    // Clear any existing timeout
    if (this.tailTrimTimeout !== null) {
      window.clearTimeout(this.tailTrimTimeout);
      this.tailTrimTimeout = null;
    }
  }
}

interface AudioContextType {
  // Audio library
  audioFiles: AudioFile[]
  addAudioFile: (file: File) => Promise<AudioFile>
  getAudioById: (id: string) => AudioFile | undefined
  updateAudioFile: (id: string, updates: Partial<AudioFile>) => void
  deleteAudioFile: (id: string) => void
  
  // Hotkeys
  banks: number
  hotkeysPerBank: number
  currentBank: number
  setCurrentBank: (bank: number) => void
  hotkeys: HotKey[]
  assignToHotkey: (bankId: number, position: number, item: AssignedItem) => void
  clearHotkey: (bankId: number, position: number) => void
  getHotkey: (bankId: number, position: number) => HotKey | undefined
  
  // Unassign mode
  isUnassignMode: boolean
  toggleUnassignMode: () => void
  
  // Playlists
  playlists: Playlist[]
  createPlaylist: (name: string) => Playlist
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void
  deletePlaylist: (id: string) => void
  addToPlaylist: (playlistId: string, audioId: string) => void
  removeFromPlaylist: (playlistId: string, itemId: string) => void
  reorderPlaylistItem: (playlistId: string, oldIndex: number, newIndex: number) => void
  
  // Playback
  playbackStatus: PlaybackStatus
  play: (item: AssignedItem) => void
  stop: () => void
  pause: () => void
  resume: () => void
  next: () => void
  previous: () => void
  setLoop: (loop: boolean) => void
  updatePlaybackTime: (time: number) => void
  
  // Audio editing
  setHeadTrim: (audioId: string, seconds: number) => void
  setTailTrim: (audioId: string, seconds: number) => void
  getEffectiveDuration: (audioFile: AudioFile) => number
}

const AudioContext = createContext<AudioContextType | null>(null)

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio must be used within an AudioContextProvider')
  }
  return context
}

export function AudioContextProvider({ children }: { children: React.ReactNode }) {
  // Audio library state
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([])
  
  // Hotkeys state
  const [banks] = useState(NUM_BANKS)
  const [hotkeysPerBank] = useState(HOTKEYS_PER_BANK)
  const [currentBank, setCurrentBank] = useState(1)
  const [hotkeys, setHotkeys] = useState<HotKey[]>(() => {
    const initialHotkeys: HotKey[] = []
    
    for (let bankId = 1; bankId <= NUM_BANKS; bankId++) {
      for (let position = 1; position <= HOTKEYS_PER_BANK; position++) {
        initialHotkeys.push({
          id: `hotkey-${bankId}-${position}`,
          bankId,
          position,
          assignedItem: null
        })
      }
    }
    
    return initialHotkeys
  })
  
  // Unassign mode state
  const [isUnassignMode, setIsUnassignMode] = useState(false)
  
  // Toggle unassign mode
  const toggleUnassignMode = useCallback(() => {
    setIsUnassignMode(prev => !prev)
  }, [])
  
  // Playlists state
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  
  // Playback state
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>({
    isPlaying: false,
    currentItem: null,
    currentAudioId: null,
    elapsedTime: 0,
    currentPlaylistId: null,
    currentPlaylistIndex: 0,
    loop: false
  })
  
  // Audio player reference
  const audioPlayerRef = useRef<AudioPlayer | null>(null)
  
  // Initialize audio player
  useEffect(() => {
    const handleTimeUpdate = (time: number) => {
      setPlaybackStatus(prev => ({
        ...prev,
        elapsedTime: time
      }))
    }
    
    const handleAudioEnded = () => {
      const { currentPlaylistId, currentPlaylistIndex, loop, currentAudioId } = playbackStatus
      
      if (currentPlaylistId) {
        const playlist = playlists.find(p => p.id === currentPlaylistId)
        
        if (playlist) {
          if (currentPlaylistIndex < playlist.items.length - 1) {
            // Move to next item in playlist
            const nextIndex = currentPlaylistIndex + 1
            const nextAudioId = playlist.items[nextIndex].audioId
            playAudio(nextAudioId, currentPlaylistId, nextIndex)
          } else if (loop) {
            // Loop playlist if enabled
            const firstAudioId = playlist.items[0].audioId
            playAudio(firstAudioId, currentPlaylistId, 0)
          } else {
            // End of playlist
            stop()
          }
          return
        }
      }
      
      // Single audio file playback
      if (loop && currentAudioId) {
        // Loop current audio if enabled
        playAudio(currentAudioId)
      } else {
        stop()
      }
    }
    
    audioPlayerRef.current = new AudioPlayer(handleTimeUpdate, handleAudioEnded)
    
    return () => {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.cleanup()
      }
    }
  }, [])
  
  // Update handleAudioEnded when playbackStatus or playlists change
  useEffect(() => {
    const handleAudioEnded = () => {
      const { currentPlaylistId, currentPlaylistIndex, loop, currentAudioId } = playbackStatus
      
      if (currentPlaylistId) {
        const playlist = playlists.find(p => p.id === currentPlaylistId)
        
        if (playlist) {
          if (currentPlaylistIndex < playlist.items.length - 1) {
            // Move to next item in playlist
            const nextIndex = currentPlaylistIndex + 1
            const nextAudioId = playlist.items[nextIndex].audioId
            playAudio(nextAudioId, currentPlaylistId, nextIndex)
          } else if (loop) {
            // Loop playlist if enabled
            const firstAudioId = playlist.items[0].audioId
            playAudio(firstAudioId, currentPlaylistId, 0)
          } else {
            // End of playlist
            stop()
          }
          return
        }
      }
      
      // Single audio file playback
      if (loop && currentAudioId) {
        // Loop current audio if enabled
        playAudio(currentAudioId)
      } else {
        stop()
      }
    }
    
    if (audioPlayerRef.current) {
      audioPlayerRef.current.onEnded = handleAudioEnded
    }
  }, [playbackStatus, playlists])
  
  // Calculate effective duration (accounting for trims)
  const getEffectiveDuration = useCallback((audioFile: AudioFile): number => {
    if (!audioFile) return 0;
    const rawDuration = audioFile.duration;
    const headTrim = audioFile.trimHead || 0;
    const tailTrim = audioFile.trimTail || 0;
    
    return Math.max(0, rawDuration - headTrim - tailTrim);
  }, []);
  
  // Add audio file
  const addAudioFile = useCallback(async (file: File): Promise<AudioFile> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader()
      
      fileReader.onload = () => {
        const audio = new Audio()
        
        audio.onloadedmetadata = () => {
          const newAudioFile: AudioFile = {
            id: uuidv4(),
            name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
            src: URL.createObjectURL(file),
            duration: audio.duration,
            volume: 1,
            type: file.type,
            trimHead: 0,
            trimTail: 0
          }
          
          setAudioFiles(prev => [...prev, newAudioFile])
          resolve(newAudioFile)
        }
        
        audio.onerror = () => {
          reject(new Error('Failed to load audio file'))
        }
        
        audio.src = URL.createObjectURL(file)
      }
      
      fileReader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      fileReader.readAsArrayBuffer(file)
    })
  }, [])
  
  // Get audio by ID
  const getAudioById = useCallback((id: string) => {
    return audioFiles.find(audio => audio.id === id)
  }, [audioFiles])
  
  // Update audio file
  const updateAudioFile = useCallback((id: string, updates: Partial<AudioFile>) => {
    setAudioFiles(prev => 
      prev.map(audio => 
        audio.id === id ? { ...audio, ...updates } : audio
      )
    )
  }, [])
  
  // Delete audio file
  const deleteAudioFile = useCallback((id: string) => {
    // Remove from hotkeys
    setHotkeys(prev => 
      prev.map(hotkey => 
        hotkey.assignedItem?.type === 'audio' && hotkey.assignedItem.id === id 
          ? { ...hotkey, assignedItem: null } 
          : hotkey
      )
    )
    
    // Remove from playlists
    setPlaylists(prev => 
      prev.map(playlist => ({
        ...playlist,
        items: playlist.items.filter(item => item.audioId !== id)
      }))
    )
    
    // Remove from audio files
    setAudioFiles(prev => prev.filter(audio => audio.id !== id))
    
    // Stop playback if playing this file
    if (playbackStatus.currentAudioId === id) {
      stop()
    }
  }, [playbackStatus])
  
  // Assign to hotkey
  const assignToHotkey = useCallback((bankId: number, position: number, item: AssignedItem) => {
    setHotkeys(prev => 
      prev.map(hotkey => 
        hotkey.bankId === bankId && hotkey.position === position
          ? { ...hotkey, assignedItem: item }
          : hotkey
      )
    )
  }, [])
  
  // Clear hotkey
  const clearHotkey = useCallback((bankId: number, position: number) => {
    setHotkeys(prev => 
      prev.map(hotkey => 
        hotkey.bankId === bankId && hotkey.position === position
          ? { ...hotkey, assignedItem: null }
          : hotkey
      )
    )
  }, [])
  
  // Get hotkey
  const getHotkey = useCallback((bankId: number, position: number) => {
    return hotkeys.find(hotkey => hotkey.bankId === bankId && hotkey.position === position)
  }, [hotkeys])
  
  // Create playlist
  const createPlaylist = useCallback((name: string): Playlist => {
    const newPlaylist: Playlist = {
      id: uuidv4(),
      name,
      items: [],
      playbackMode: 'follow-on'
    }
    
    setPlaylists(prev => [...prev, newPlaylist])
    return newPlaylist
  }, [])
  
  // Update playlist
  const updatePlaylist = useCallback((id: string, updates:Partial<Playlist>) => {
    setPlaylists(prev => 
      prev.map(playlist => 
        playlist.id === id ? { ...playlist, ...updates } : playlist
      )
    )
  }, [])
  
  // Delete playlist
  const deletePlaylist = useCallback((id: string) => {
    // Remove from hotkeys
    setHotkeys(prev => 
      prev.map(hotkey => 
        hotkey.assignedItem?.type === 'playlist' && hotkey.assignedItem.id === id 
          ? { ...hotkey, assignedItem: null } 
          : hotkey
      )
    )
    
    // Remove playlist
    setPlaylists(prev => prev.filter(playlist => playlist.id !== id))
    
    // Stop playback if playing this playlist
    if (playbackStatus.currentPlaylistId === id) {
      stop()
    }
  }, [playbackStatus])
  
  // Add to playlist
  const addToPlaylist = useCallback((playlistId: string, audioId: string) => {
    setPlaylists(prev => {
      // Create a new playlists array with the updated playlist
      const updatedPlaylists = prev.map(playlist => {
        if (playlist.id === playlistId) {
          // Always add the audio file to the playlist (allow duplicates)
          return {
            ...playlist,
            items: [...playlist.items, { audioId, id: uuidv4() }]
          };
        }
        return playlist;
      });
      
      return updatedPlaylists;
    });
  }, [])
  
  // Remove from playlist
  const removeFromPlaylist = useCallback((playlistId: string, itemId: string) => {
    setPlaylists(prev => 
      prev.map(playlist => {
        if (playlist.id === playlistId) {
          return {
            ...playlist,
            items: playlist.items.filter(item => item.id !== itemId)
          }
        }
        return playlist
      })
    )
  }, [])
  
  // Reorder playlist item
  const reorderPlaylistItem = useCallback((playlistId: string, oldIndex: number, newIndex: number) => {
    setPlaylists(prev => 
      prev.map(playlist => {
        if (playlist.id === playlistId) {
          const items = [...playlist.items]
          const [removed] = items.splice(oldIndex, 1)
          items.splice(newIndex, 0, removed)
          
          return {
            ...playlist,
            items
          }
        }
        return playlist
      })
    )
  }, [])
  
  // Play audio
  const playAudio = useCallback((audioId: string, playlistId?: string, playlistIndex?: number) => {
    const audioFile = audioFiles.find(audio => audio.id === audioId)
    
    if (audioFile && audioPlayerRef.current) {
      // Get start time based on head trim
      const startTime = audioFile.trimHead || 0
      const tailTrim = audioFile.trimTail || 0
      
      // Play audio with trim values
      audioPlayerRef.current.play(
        audioFile.src, 
        audioFile.volume, 
        startTime, 
        tailTrim, 
        audioFile.duration
      )
      
      // Update playback status
      setPlaybackStatus(prev => ({
        ...prev,
        isPlaying: true,
        currentAudioId: audioId,
        elapsedTime: startTime,
        currentPlaylistId: playlistId || null,
        currentPlaylistIndex: playlistIndex !== undefined ? playlistIndex : 0,
      }))
    }
  }, [audioFiles])
  
  // Play
  const play = useCallback((item: AssignedItem) => {
    if (item.type === 'audio') {
      // Play single audio
      playAudio(item.id)
      setPlaybackStatus(prev => ({
        ...prev,
        currentItem: item,
        currentPlaylistId: null,
        currentPlaylistIndex: 0,
      }))
    } else if (item.type === 'playlist') {
      // Play playlist
      const playlist = playlists.find(p => p.id === item.id)
      
      if (playlist && playlist.items.length > 0) {
        const firstAudioId = playlist.items[0].audioId
        playAudio(firstAudioId, playlist.id, 0)
        setPlaybackStatus(prev => ({
          ...prev,
          currentItem: item,
        }))
      }
    }
  }, [playlists, playAudio])
  
  // Stop
  const stop = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.stop()
    }
    
    setPlaybackStatus(prev => ({
      isPlaying: false,
      currentItem: null,
      currentAudioId: null,
      elapsedTime: 0,
      currentPlaylistId: null,
      currentPlaylistIndex: 0,
      loop: prev.loop
    }))
  }, [])
  
  // Pause
  const pause = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause()
    }
    
    setPlaybackStatus(prev => ({
      ...prev,
      isPlaying: false
    }))
  }, [])
  
  // Resume
  const resume = useCallback(() => {
    if (audioPlayerRef.current && playbackStatus.currentAudioId) {
      const audioFile = audioFiles.find(audio => audio.id === playbackStatus.currentAudioId)
      
      if (audioFile) {
        const tailTrim = audioFile.trimTail || 0
        
        audioPlayerRef.current.play(
          audioFile.src, 
          audioFile.volume, 
          playbackStatus.elapsedTime,
          tailTrim,
          audioFile.duration
        )
        
        setPlaybackStatus(prev => ({
          ...prev,
          isPlaying: true
        }))
      }
    }
  }, [playbackStatus.currentAudioId, audioFiles, playbackStatus.elapsedTime])
  
  // Next
  const next = useCallback(() => {
    const { currentPlaylistId, currentPlaylistIndex } = playbackStatus
    
    if (currentPlaylistId) {
      const playlist = playlists.find(p => p.id === currentPlaylistId)
      
      if (playlist && currentPlaylistIndex < playlist.items.length - 1) {
        const nextIndex = currentPlaylistIndex + 1
        const nextAudioId = playlist.items[nextIndex].audioId
        playAudio(nextAudioId, currentPlaylistId, nextIndex)
      }
    }
  }, [playbackStatus, playlists, playAudio])
  
  // Previous
  const previous = useCallback(() => {
    const { currentPlaylistId, currentPlaylistIndex } = playbackStatus
    
    if (currentPlaylistId) {
      const playlist = playlists.find(p => p.id === currentPlaylistId)
      
      if (playlist && currentPlaylistIndex > 0) {
        const prevIndex = currentPlaylistIndex - 1
        const prevAudioId = playlist.items[prevIndex].audioId
        playAudio(prevAudioId, currentPlaylistId, prevIndex)
      }
    }
  }, [playbackStatus, playlists, playAudio])
  
  // Set loop
  const setLoop = useCallback((loop: boolean) => {
    setPlaybackStatus(prev => ({
      ...prev,
      loop
    }))
  }, [])
  
  // Update playback time
  const updatePlaybackTime = useCallback((time: number) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.setCurrentTime(time)
    }
  }, [])
  
  // Set head trim
  const setHeadTrim = useCallback((audioId: string, seconds: number) => {
    setAudioFiles(prev => 
      prev.map(audio => {
        if (audio.id === audioId) {
          return {
            ...audio,
            trimHead: Math.max(0, Math.min(seconds, audio.duration - (audio.trimTail || 0) - 0.1))
          }
        }
        return audio
      })
    )
    
    // Update current playback if this audio is playing
    if (playbackStatus.currentAudioId === audioId && audioPlayerRef.current) {
      const audio = audioFiles.find(a => a.id === audioId)
      if (audio) {
        const newHeadTrim = Math.max(0, Math.min(seconds, audio.duration - (audio.trimTail || 0) - 0.1))
        
        const currentTime = audioPlayerRef.current.getCurrentTime()
        if (currentTime < newHeadTrim) {
          audioPlayerRef.current.setCurrentTime(newHeadTrim)
        }
      }
    }
  }, [audioFiles, playbackStatus.currentAudioId])
  
  // Set tail trim
  const setTailTrim = useCallback((audioId: string, seconds: number) => {
    setAudioFiles(prev => 
      prev.map(audio => {
        if (audio.id === audioId) {
          return {
            ...audio,
            trimTail: Math.max(0, Math.min(seconds, audio.duration - (audio.trimHead || 0) - 0.1))
          }
        }
        return audio
      })
    )
    
    // If this audio is currently playing, we need to update the tail trim in the player
    if (playbackStatus.currentAudioId === audioId && audioPlayerRef.current) {
      const audio = audioFiles.find(a => a.id === audioId)
      if (audio) {
        const newTailTrim = Math.max(0, Math.min(seconds, audio.duration - (audio.trimHead || 0) - 0.1))
        
        // We need to update the player's tail trim value
        if (audioPlayerRef.current) {
          audioPlayerRef.current.currentTailTrim = newTailTrim;
          audioPlayerRef.current.currentDuration = audio.duration;
        }
      }
    }
  }, [audioFiles, playbackStatus.currentAudioId])
  
  const value: AudioContextType = {
    audioFiles,
    addAudioFile,
    getAudioById,
    updateAudioFile,
    deleteAudioFile,
    
    banks,
    hotkeysPerBank,
    currentBank,
    setCurrentBank,
    hotkeys,
    assignToHotkey,
    clearHotkey,
    getHotkey,
    
    isUnassignMode,
    toggleUnassignMode,
    
    playlists,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    reorderPlaylistItem,
    
    playbackStatus,
    play,
    stop,
    pause,
    resume,
    next,
    previous,
    setLoop,
    updatePlaybackTime,
    
    setHeadTrim,
    setTailTrim,
    getEffectiveDuration
  }
  
  return (
    <AudioContext.Provider value={value}>
      {children}
    </AudioContext.Provider>
  )
}
