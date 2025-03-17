import { useState, useEffect } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { Playlist } from '../types'
import { X, ArrowUp, ArrowDown, Play, Pause, Save } from 'lucide-react'

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
    getEffectiveDuration
  } = useAudio()
  
  const [name, setName] = useState(playlist.name)
  
  // Update name when playlist changes
  useEffect(() => {
    setName(playlist.name)
  }, [playlist])
  
  const handleSave = () => {
    updatePlaylist(playlist.id, { name })
    onClose()
  }
  
  const handleRemove = (itemId: string) => {
    removeFromPlaylist(playlist.id, itemId)
  }
  
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderPlaylistItem(playlist.id, index, index - 1)
    }
  }
  
  const handleMoveDown = (index: number) => {
    if (index < playlist.items.length - 1) {
      reorderPlaylistItem(playlist.id, index, index + 1)
    }
  }
  
  const handlePlay = () => {
    const isCurrentlyPlaying = 
      playbackStatus.isPlaying && 
      playbackStatus.currentItem?.type === 'playlist' && 
      playbackStatus.currentItem.id === playlist.id
    
    if (isCurrentlyPlaying) {
      stop()
    } else {
      play({
        type: 'playlist',
        id: playlist.id
      })
    }
  }
  
  // Calculate total duration
  const getTotalDuration = () => {
    let total = 0
    
    playlist.items.forEach(item => {
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
    playbackStatus.currentItem.id === playlist.id
  
  return (
    <div className="p-4 bg-gray-800 rounded-lg">
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
          Tracks ({playlist.items.length}) - {getTotalDuration()}
        </div>
        
        <div className="flex gap-2">
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
      
      {playlist.items.length === 0 ? (
        <div className="text-center py-4 text-gray-400">
          No tracks in playlist. Drag audio files here.
        </div>
      ) : (
        <div className="max-h-96 overflow-y-auto">
          {playlist.items.map((item, index) => {
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
                    disabled={index === playlist.items.length - 1}
                  >
                    <ArrowDown size={16} className={index === playlist.items.length - 1 ? 'opacity-50' : ''} />
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
