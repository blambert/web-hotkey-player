import { useState, useEffect } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { useDnd } from '../contexts/DndContext'
import { Playlist, AudioFile } from '../types'
import { Music, Trash2, ArrowUp, ArrowDown, X, ListMusic, Plus, Check } from 'lucide-react'

interface PlaylistEditorProps {
  playlist: Playlist
  onClose: () => void
}

export default function PlaylistEditor({ playlist, onClose }: PlaylistEditorProps) {
  const { 
    audioFiles, 
    updatePlaylist, 
    removeFromPlaylist, 
    reorderPlaylistItem,
    addToPlaylist,
    playbackStatus,
    play,
    playlists
  } = useAudio()
  
  const { draggedItem, setDraggedItem } = useDnd()
  const [showAddTracksModal, setShowAddTracksModal] = useState(false)
  const [selectedTracks, setSelectedTracks] = useState<string[]>([])
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist>(playlist)
  
  // Update the current playlist when the playlist prop changes or when playlists state changes
  useEffect(() => {
    const updatedPlaylist = playlists.find(p => p.id === playlist.id);
    if (updatedPlaylist) {
      setCurrentPlaylist(updatedPlaylist);
    }
  }, [playlist, playlists]);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    
    if (draggedItem && draggedItem.type === 'audio') {
      addToPlaylist(currentPlaylist.id, draggedItem.id)
      setDraggedItem(null)
    }
  }
  
  const handleRemoveItem = (itemId: string) => {
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
  
  const handlePlaybackModeChange = () => {
    const newMode = currentPlaylist.playbackMode === 'follow-on' ? 'manual' : 'follow-on'
    updatePlaylist(currentPlaylist.id, { playbackMode: newMode })
  }
  
  const openAddTracksModal = () => {
    setSelectedTracks([])
    setShowAddTracksModal(true)
  }
  
  const closeAddTracksModal = () => {
    setShowAddTracksModal(false)
  }
  
  const toggleTrackSelection = (audioId: string) => {
    setSelectedTracks(prev => 
      prev.includes(audioId)
        ? prev.filter(id => id !== audioId)
        : [...prev, audioId]
    )
  }
  
  const handleAddSelectedTracks = () => {
    selectedTracks.forEach(audioId => {
      addToPlaylist(currentPlaylist.id, audioId)
    })
    closeAddTracksModal()
  }
  
  // Get all available audio files (no filtering for duplicates)
  const availableAudioFiles = audioFiles
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        <div className="p-3 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <ListMusic size={18} className="text-green-500 mr-2" />
            <h2 className="text-lg font-bold">{currentPlaylist.name}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-700">
            <X size={18} />
          </button>
        </div>
        
        <div 
          className="flex-1 overflow-y-auto p-3"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-400">
              {currentPlaylist.items.length} {currentPlaylist.items.length === 1 ? 'track' : 'tracks'}
            </div>
            
            <div className="flex space-x-2">
              <button
                className="px-2 py-1 rounded text-xs bg-blue-600 text-white hover:bg-blue-700 flex items-center"
                onClick={openAddTracksModal}
              >
                <Plus size={12} className="mr-1" />
                Add Tracks
              </button>
              
              <button
                className={`px-2 py-1 rounded text-xs ${
                  currentPlaylist.playbackMode === 'follow-on' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-yellow-600 text-white'
                }`}
                onClick={handlePlaybackModeChange}
              >
                {currentPlaylist.playbackMode === 'follow-on' ? 'Follow-on Mode' : 'Manual Mode'}
              </button>
            </div>
          </div>
          
          {currentPlaylist.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-500">
              <p className="mb-2">No tracks in playlist</p>
              <p className="text-xs">Drag and drop audio files here or use the Add Tracks button</p>
            </div>
          ) : (
            currentPlaylist.items.map((item, index) => {
              const audio = audioFiles.find(a => a.id === item.audioId)
              
              if (!audio) return null
              
              const isPlaying = 
                playbackStatus.isPlaying && 
                playbackStatus.currentPlaylistId === currentPlaylist.id &&
                playbackStatus.currentAudioId === audio.id
              
              return (
                <div 
                  key={item.id}
                  className={`p-2 mb-1 rounded ${
                    isPlaying ? 'bg-blue-900/50 border border-blue-500' : 'bg-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center flex-1">
                      <div className="text-gray-400 mr-2 w-5 text-center">{index + 1}</div>
                      <Music size={14} className="text-blue-400 mr-1" />
                      <div className="text-sm font-medium truncate">{audio.name}</div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button 
                        className={`p-1 rounded hover:bg-gray-600 ${index === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                      >
                        <ArrowUp size={14} />
                      </button>
                      
                      <button 
                        className={`p-1 rounded hover:bg-gray-600 ${index === currentPlaylist.items.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handleMoveDown(index)}
                        disabled={index === currentPlaylist.items.length - 1}
                      >
                        <ArrowDown size={14} />
                      </button>
                      
                      <button 
                        className="p-1 rounded hover:bg-gray-600 text-red-400"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
        
        <div className="p-3 border-t border-gray-700 flex justify-between">
          <button 
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => play({ type: 'playlist', id: currentPlaylist.id })}
          >
            Play Playlist
          </button>
          
          <button 
            className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
      
      {/* Add Tracks Modal */}
      {showAddTracksModal && (
        <div className="fixed inset-0 bg-black/70 z-60 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden">
            <div className="p-3 border-b border-gray-700 flex justify-between items-center">
              <h2 className="text-lg font-bold">Add Tracks to Playlist</h2>
              <button onClick={closeAddTracksModal} className="p-1 rounded hover:bg-gray-700">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3">
              {availableAudioFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                  <p>No available audio files</p>
                  <p className="text-xs mt-1">Upload some audio files first</p>
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-400 mb-2">
                    Select tracks to add to "{currentPlaylist.name}"
                  </div>
                  
                  {availableAudioFiles.map(audio => (
                    <div 
                      key={audio.id}
                      className={`p-2 mb-1 rounded flex items-center cursor-pointer ${
                        selectedTracks.includes(audio.id) ? 'bg-blue-900/50 border border-blue-500' : 'bg-gray-700 hover:bg-gray-650'
                      }`}
                      onClick={() => toggleTrackSelection(audio.id)}
                    >
                      <div className="w-6 flex justify-center">
                        {selectedTracks.includes(audio.id) ? (
                          <Check size={16} className="text-blue-400" />
                        ) : null}
                      </div>
                      
                      <div className="flex items-center flex-1">
                        <Music size={14} className="text-blue-400 mr-1" />
                        <div className="text-sm font-medium truncate">{audio.name}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            
            <div className="p-3 border-t border-gray-700 flex justify-between">
              <div className="text-sm text-gray-400">
                {selectedTracks.length} selected
              </div>
              
              <div className="flex space-x-2">
                <button 
                  className="px-4 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                  onClick={closeAddTracksModal}
                >
                  Cancel
                </button>
                
                <button 
                  className={`px-4 py-2 rounded bg-blue-600 text-white ${
                    selectedTracks.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                  }`}
                  onClick={handleAddSelectedTracks}
                  disabled={selectedTracks.length === 0}
                >
                  Add Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
