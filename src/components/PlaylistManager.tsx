import { useState, useRef } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { useDnd } from '../contexts/DndContext'
import { Playlist } from '../types'
import { ListMusic, Play, ListPlus, Trash2, Edit, Save, X, Menu, ChevronDown, ChevronUp } from 'lucide-react'
import PlaylistEditor from './PlaylistEditor'

export default function PlaylistManager() {
  const { 
    playlists, 
    createPlaylist, 
    deletePlaylist, 
    updatePlaylist,
    play
  } = useAudio()
  
  const { setDraggedItem } = useDnd()
  const [showNameInput, setShowNameInput] = useState(false)
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null)
  const [editingName, setEditingName] = useState<{ id: string, name: string } | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)
  
  const handleCreatePlaylist = () => {
    setShowNameInput(true)
    setTimeout(() => {
      nameInputRef.current?.focus()
    }, 0)
  }
  
  const handleConfirmCreate = () => {
    if (nameInputRef.current?.value) {
      createPlaylist(nameInputRef.current.value)
      setShowNameInput(false)
    }
  }
  
  const handleDragStart = (playlist: Playlist) => {
    setDraggedItem({
      type: 'playlist',
      id: playlist.id
    })
  }
  
  const handleEditName = (playlist: Playlist) => {
    setEditingName({ id: playlist.id, name: playlist.name })
    setTimeout(() => {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }, 0)
  }
  
  const handleSaveName = () => {
    if (editingName && nameInputRef.current?.value) {
      updatePlaylist(editingName.id, { name: nameInputRef.current.value })
      setEditingName(null)
    }
  }
  
  const handlePlaybackModeChange = (playlist: Playlist) => {
    const newMode = playlist.playbackMode === 'follow-on' ? 'manual' : 'follow-on'
    updatePlaylist(playlist.id, { playbackMode: newMode })
  }
  
  const handleEdit = (playlist: Playlist) => {
    setEditingPlaylist(playlist)
  }
  
  return (
    <div className="p-2 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-400">{playlists.length} playlists</div>
        <button 
          className="text-xs px-2 py-1 bg-green-600 rounded text-white hover:bg-green-700"
          onClick={handleCreatePlaylist}
        >
          New Playlist
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {showNameInput && (
          <div className="p-2 bg-gray-800 rounded mb-2">
            <div className="flex space-x-2">
              <input 
                ref={nameInputRef}
                type="text"
                className="flex-1 px-2 py-1 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none"
                placeholder="Playlist name"
              />
              <button 
                className="p-1 rounded hover:bg-gray-700"
                onClick={handleConfirmCreate}
              >
                <Save size={18} className="text-green-500" />
              </button>
              <button 
                className="p-1 rounded hover:bg-gray-700"
                onClick={() => setShowNameInput(false)}
              >
                <X size={18} className="text-red-500" />
              </button>
            </div>
          </div>
        )}
        
        {playlists.map(playlist => (
          <div 
            key={playlist.id}
            className="p-2 mb-1 bg-gray-800 rounded hover:bg-gray-700 cursor-grab"
            draggable={editingName?.id !== playlist.id}
            onDragStart={() => handleDragStart(playlist)}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center flex-1">
                <ListMusic size={14} className="text-green-400 mr-1 flex-shrink-0" />
                
                {editingName?.id === playlist.id ? (
                  <div className="flex space-x-1 flex-1">
                    <input 
                      ref={nameInputRef}
                      type="text"
                      className="flex-1 px-2 py-0.5 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 outline-none text-sm"
                      defaultValue={editingName.name}
                    />
                    <button 
                      className="p-1 rounded hover:bg-gray-700"
                      onClick={handleSaveName}
                    >
                      <Save size={14} className="text-green-500" />
                    </button>
                    <button 
                      className="p-1 rounded hover:bg-gray-700"
                      onClick={() => setEditingName(null)}
                    >
                      <X size={14} className="text-red-500" />
                    </button>
                  </div>
                ) : (
                  <div className="text-sm font-medium truncate flex-1">{playlist.name}</div>
                )}
              </div>
              
              {editingName?.id !== playlist.id && (
                <div className="flex space-x-1">
                  <button 
                    className="p-1 rounded hover:bg-gray-600"
                    onClick={() => play({ type: 'playlist', id: playlist.id })}
                  >
                    <Play size={14} />
                  </button>
                  
                  <button 
                    className="p-1 rounded hover:bg-gray-600"
                    onClick={() => handleEditName(playlist)}
                  >
                    <Edit size={14} />
                  </button>
                  
                  <button 
                    className="p-1 rounded hover:bg-gray-600"
                    onClick={() => handleEdit(playlist)}
                  >
                    <Menu size={14} />
                  </button>
                  
                  <button 
                    className="p-1 rounded hover:bg-gray-600 text-red-400"
                    onClick={() => deletePlaylist(playlist.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center text-xs text-gray-400 justify-between">
              <div>
                {playlist.items.length} {playlist.items.length === 1 ? 'track' : 'tracks'}
              </div>
              
              <button
                className={`text-xs flex items-center ${
                  playlist.playbackMode === 'follow-on' 
                    ? 'text-green-400' 
                    : 'text-yellow-400'
                }`}
                onClick={() => handlePlaybackModeChange(playlist)}
              >
                {playlist.playbackMode === 'follow-on' ? (
                  <>
                    <ChevronDown size={12} className="mr-0.5" />
                    Follow-on
                  </>
                ) : (
                  <>
                    <ChevronUp size={12} className="mr-0.5" />
                    Manual
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
        
        {playlists.length === 0 && !showNameInput && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p className="mb-2">No playlists yet</p>
            <button 
              className="px-3 py-1 bg-green-600 rounded text-white hover:bg-green-700"
              onClick={handleCreatePlaylist}
            >
              Create Playlist
            </button>
          </div>
        )}
      </div>
      
      {editingPlaylist && (
        <PlaylistEditor 
          playlist={editingPlaylist}
          onClose={() => setEditingPlaylist(null)}
        />
      )}
    </div>
  )
}
