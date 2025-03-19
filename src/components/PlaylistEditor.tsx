import { useState, useEffect, useMemo } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { Playlist } from '../types'
import { X, ArrowUp, ArrowDown, Play, Pause, Save, Plus, Search, Check, ArrowLeft } from 'lucide-react'

interface PlaylistEditorProps {
  playlist: Playlist
  onClose: () => void
}

export default function PlaylistEditor({ playlist, onClose }: PlaylistEditorProps) {
  const { 
    getAudioById, 
    updatePlaylist, 
    removeFromPlaylist, 
    reorderPlaylistItem,
    play,
    stop,
    playbackStatus,
    getEffectiveDuration,
    audioFiles,
    addToPlaylist,
    playlists
  } = useAudio()
  
  const [name, setName] = useState(playlist.name)
  const [showAddTracks, setShowAddTracks] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTracks, setSelectedTracks] = useState<string[]>([])
  
  // Get the latest version of the playlist from context
  const currentPlaylist = useMemo(() => {
    return playlists.find(p => p.id === playlist.id) || playlist
  }, [playlists, playlist.id])
  
  // Update name when playlist changes
  useEffect(() => {
    setName(currentPlaylist.name)
  }, [currentPlaylist])
  
  // Reset selections when closing add tracks panel
  useEffect(() => {
    if (!showAddTracks) {
      setSelectedTracks([])
      setSearchQuery('')
    }
  }, [showAddTracks])
  
  // Save name immediately when it changes
  useEffect(() => {
    // Only update if the name has actually changed
    if (name !== currentPlaylist.name) {
      updatePlaylist(currentPlaylist.id, { name })
    }
  }, [name, currentPlaylist.id, currentPlaylist.name, updatePlaylist])
  
  const handleSave = () => {
    onClose()
  }
  
  const handleRemove = (itemId: string) => {
    removeFromPlaylist(currentPlaylist.id, itemId)
  }
  
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderPlaylistItem(currentPlaylist.id, index, index - 1)
    }
  }
  
  const handleMoveDown = (index: number) => {
    if (index < currentPlaylist.items.length - 1) {
      reorderPlaylistItem(currentPlaylist.id, index, index + 1)
    }
  }
  
  const handlePlay = () => {
    const isCurrentlyPlaying = 
      playbackStatus.isPlaying && 
      playbackStatus.currentItem?.type === 'playlist' && 
      playbackStatus.currentItem.id === currentPlaylist.id
    
    if (isCurrentlyPlaying) {
      stop()
    } else {
      play({
        type: 'playlist',
        id: currentPlaylist.id
      })
    }
  }
  
  // Calculate total duration
  const getTotalDuration = () => {
    let total = 0
    
    currentPlaylist.items.forEach(item => {
      const audio = getAudioById(item.audioId)
      if (audio) {
        total += getEffectiveDuration(audio)
      }
    })
    
    return formatTime(total)
  }
  
  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }
  
  const isPlaying = 
    playbackStatus.isPlaying && 
    playbackStatus.currentItem?.type === 'playlist' && 
    playbackStatus.currentItem.id === currentPlaylist.id
  
  // Toggle track selection
  const toggleTrackSelection = (audioId: string) => {
    setSelectedTracks(prev => {
      if (prev.includes(audioId)) {
        return prev.filter(id => id !== audioId)
      } else {
        return [...prev, audioId]
      }
    })
  }
  
  // Add selected tracks to playlist
  const handleAddSelectedTracks = () => {
    // Add each selected track to the playlist
    selectedTracks.forEach(audioId => {
      addToPlaylist(currentPlaylist.id, audioId)
    })
    
    // Close the add tracks panel
    setShowAddTracks(false)
  }
  
  // Filter audio files based on search query
  const filteredAudioFiles = useMemo(() => {
    if (!searchQuery.trim()) {
      return audioFiles
    }
    
    const query = searchQuery.toLowerCase()
    return audioFiles.filter(audio => 
      audio.name.toLowerCase().includes(query)
    )
  }, [audioFiles, searchQuery])
  
  // Sort audio files alphabetically
  const sortedAudioFiles = useMemo(() => {
    return [...filteredAudioFiles].sort((a, b) => 
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    )
  }, [filteredAudioFiles])
  
  // Render Add Tracks panel
  if (showAddTracks) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg max-h-full overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <button 
              className="p-1 mr-2 rounded-full hover:bg-gray-700"
              onClick={() => setShowAddTracks(false)}
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-xl font-bold">Add Tracks</h2>
          </div>
          
          <button 
            className="p-2 rounded bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:bg-gray-600"
            onClick={handleAddSelectedTracks}
            disabled={selectedTracks.length === 0}
          >
            Add {selectedTracks.length > 0 ? `(${selectedTracks.length})` : ''}
          </button>
        </div>
        
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search tracks..."
            className="w-full pl-10 p-2 bg-gray-700 rounded"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setSearchQuery('')}
            >
              <X size={16} className="text-gray-400" />
            </button>
          )}
        </div>
        
        {sortedAudioFiles.length === 0 ? (
          <div className="text-center py-4 text-gray-400">
            No matching tracks found.
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto border border-gray-700 rounded">
            {sortedAudioFiles.map(audio => {
              const isSelected = selectedTracks.includes(audio.id)
              const isInPlaylist = currentPlaylist.items.some(item => item.audioId === audio.id)
              
              return (
                <div 
                  key={audio.id}
                  className={`
                    flex items-center justify-between p-2 
                    ${isInPlaylist ? 'bg-gray-600 opacity-50' : isSelected ? 'bg-blue-800' : 'bg-gray-700'} 
                    ${!isInPlaylist && 'hover:bg-gray-600 cursor-pointer'}
                    ${!isInPlaylist && isSelected && 'hover:bg-blue-700'}
                    mb-1 rounded
                  `}
                  onClick={() => !isInPlaylist && toggleTrackSelection(audio.id)}
                >
                  <div className="flex items-center">
                    <div className={`mr-3 w-6 h-6 flex items-center justify-center rounded-full border ${isSelected ? 'border-blue-400 bg-blue-500' : 'border-gray-500'}`}>
                      {isSelected && <Check size={14} />}
                    </div>
                    <div>
                      <div className="font-medium">{audio.name.replace(/_/g, ' ')}</div>
                      <div className="text-xs opacity-70">
                        {formatTime(getEffectiveDuration(audio))}
                        {(audio.trimHead > 0 || audio.trimTail > 0) && (
                          <span className="ml-1 text-yellow-500">
                            (trimmed)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {isInPlaylist && (
                    <div className="text-xs text-gray-400">
                      Already in playlist
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }
  
  // Main playlist editor view
  return (
    <div className="p-4 bg-gray-800 rounded-lg max-h-full overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Edit Playlist</h2>
        <button 
          className="p-1 rounded-full hover:bg-gray-700"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Name
        </label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded"
        />
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <div className="text-sm font-medium">
          Tracks ({currentPlaylist.items.length}) - {getTotalDuration()}
        </div>
        
        <div className="flex gap-2">
          <button 
            className="p-2 rounded bg-green-600 hover:bg-green-500"
            onClick={() => setShowAddTracks(true)}
          >
            <Plus size={16} />
          </button>
          
          <button 
            className={`p-2 rounded ${isPlaying ? 'bg-yellow-500 text-black' : 'bg-blue-600 hover:bg-blue-500'}`}
            onClick={handlePlay}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          
          <button 
            className="p-2 rounded bg-green-600 hover:bg-green-500"
            onClick={handleSave}
          >
            <Save size={16} />
          </button>
        </div>
      </div>
      
      {currentPlaylist.items.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          <div>No tracks in playlist.</div>
          <button 
            className="mt-2 p-1 text-blue-400 hover:text-blue-300"
            onClick={() => setShowAddTracks(true)}
          >
            Click to add tracks
          </button>
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {currentPlaylist.items.map((item, index) => {
            const audio = getAudioById(item.audioId)
            const isCurrentTrack = 
              isPlaying && 
              playbackStatus.currentAudioId === item.audioId
            
            return (
              <div 
                key={item.id} 
                className={`
                  flex items-center justify-between p-2 mb-1 rounded
                  ${isCurrentTrack 
                    ? 'bg-yellow-500 text-black' 
                    : 'bg-gray-700 hover:bg-gray-600'}
                `}
              >
                <div className="flex items-center">
                  <span className="mr-2 text-sm w-6 text-center">{index + 1}</span>
                  <div>
                    <div className="font-medium">{audio?.name.replace(/_/g, ' ') || 'Unknown'}</div>
                    {audio && (
                      <div className="text-xs opacity-70">
                        {formatTime(getEffectiveDuration(audio))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-1">
                  <button 
                    className="p-1 rounded hover:bg-gray-500"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUp size={16} className={index === 0 ? 'opacity-50' : ''} />
                  </button>
                  
                  <button 
                    className="p-1 rounded hover:bg-gray-500"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === currentPlaylist.items.length - 1}
                  >
                    <ArrowDown size={16} className={index === currentPlaylist.items.length - 1 ? 'opacity-50' : ''} />
                  </button>
                  
                  <button 
                    className="p-1 rounded hover:bg-red-500"
                    onClick={() => handleRemove(item.id)}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
