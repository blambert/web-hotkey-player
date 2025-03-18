import { useState } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { useDnd } from '../contexts/DndContext'
import { Playlist } from '../types'
import { Plus, Edit, Trash, Play, Pause } from 'lucide-react'
import PlaylistEditor from './PlaylistEditor'

export default function PlaylistManager() {
  const { 
    playlists, 
    createPlaylist, 
    deletePlaylist, 
    play, 
    stop, 
    playbackStatus,
    getAudioById,
    getEffectiveDuration
  } = useAudio()
  
  const { setDraggedItem, selectedItem, setSelectedItem } = useDnd()
  
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  
  const handleCreatePlaylist = () => {
    const newName = `New Playlist ${playlists.length + 1}`
    const playlist = createPlaylist(newName)
    setEditingPlaylist(playlist)
  }
  
  const handleDeletePlaylist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this playlist?')) {
      deletePlaylist(id)
    }
  }
  
  const handlePlayPlaylist = (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
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
  
  const handleDragStart = (e: React.DragEvent, playlist: Playlist) => {
    setDraggedItem({
      id: playlist.id,
      type: 'playlist'
    })
  }
  
  const handleSelectPlaylist = (playlist: Playlist) => {
    // Toggle selection - if already selected, deselect it
    if (selectedItem && selectedItem.type === 'playlist' && selectedItem.id === playlist.id) {
      setSelectedItem(null)
    } else {
      setSelectedItem({
        type: 'playlist',
        id: playlist.id
      })
    }
  }
  
  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }
  
  // Calculate playlist duration
  const getPlaylistDuration = (playlist: Playlist) => {
    return playlist.items.reduce((total, item) => {
      const audio = getAudioById(item.audioId)
      return total + (audio ? getEffectiveDuration(audio) : 0)
    }, 0)
  }
  
  return (
    <div className="p-4">
      {editingPlaylist ? (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-auto">
            <PlaylistEditor 
              playlist={editingPlaylist} 
              onClose={() => setEditingPlaylist(null)} 
            />
          </div>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Playlists</h2>
            <button 
              className="p-2 rounded bg-green-600 hover:bg-green-500"
              onClick={handleCreatePlaylist}
            >
              <Plus size={16} />
            </button>
          </div>
          
          {playlists.length === 0 ? (
            <div className="text-center py-4 text-gray-400">
              No playlists. Create one to get started.
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {playlists.map(playlist => {
                const isPlaying = 
                  playbackStatus.isPlaying && 
                  playbackStatus.currentItem?.type === 'playlist' && 
                  playbackStatus.currentItem.id === playlist.id;
                
                // Check if this playlist is the currently selected item
                const isSelected = selectedItem && 
                                  selectedItem.type === 'playlist' && 
                                  selectedItem.id === playlist.id;
                
                return (
                  <div 
                    key={playlist.id}
                    className={`
                      p-2 rounded flex justify-between items-center cursor-pointer
                      ${isPlaying 
                        ? 'bg-yellow-500 text-black' 
                        : isSelected 
                          ? 'bg-blue-900' 
                          : 'bg-gray-700 hover:bg-gray-600'}
                    `}
                    draggable
                    onDragStart={(e) => handleDragStart(e, playlist)}
                    onClick={() => handleSelectPlaylist(playlist)}
                  >
                    <div>
                      <div className="font-medium">{playlist.name.replace(/_/g, ' ')}</div>
                      <div className="text-xs opacity-70">
                        {playlist.items.length} tracks • {formatTime(getPlaylistDuration(playlist))}
                      </div>
                    </div>
                    
                    <div className="flex gap-1">
                      <button 
                        className={`p-1 rounded ${isPlaying ? 'bg-black bg-opacity-20' : 'hover:bg-gray-500'}`}
                        onClick={(e) => handlePlayPlaylist(playlist, e)}
                      >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      
                      <button 
                        className="p-1 rounded hover:bg-gray-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPlaylist(playlist);
                        }}
                      >
                        <Edit size={16} />
                      </button>
                      
                      <button 
                        className="p-1 rounded hover:bg-red-500"
                        onClick={(e) => handleDeletePlaylist(playlist.id, e)}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
