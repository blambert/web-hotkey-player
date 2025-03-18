import { MouseEvent } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { useDnd } from '../contexts/DndContext'
import { HotKey } from '../types'
import { Music, ListMusic, X } from 'lucide-react'

interface HotKeyButtonProps {
  hotkey: HotKey | undefined
  isPlaying: boolean
}

export default function HotKeyButton({ hotkey, isPlaying }: HotKeyButtonProps) {
  const { 
    play, 
    stop, 
    getAudioById, 
    assignToHotkey, 
    clearHotkey, 
    playbackStatus, 
    playlists, 
    getEffectiveDuration,
    isUnassignMode
  } = useAudio()
  
  const { draggedItem, setDraggedItem, selectedItem, setSelectedItem } = useDnd()
  
  if (!hotkey) return null
  
  const handleClick = () => {
    if (isUnassignMode && hotkey.assignedItem) {
      // In unassign mode, clear the hotkey
      clearHotkey(hotkey.bankId, hotkey.position)
      return
    }
    
    if (selectedItem && !hotkey.assignedItem) {
      // If an item is selected and this hotkey is empty, assign the selected item
      assignToHotkey(hotkey.bankId, hotkey.position, {
        type: selectedItem.type as 'audio' | 'playlist',
        id: selectedItem.id
      })
      // Clear the selection after assigning
      setSelectedItem(null)
      return
    }
    
    if (hotkey.assignedItem) {
      // Otherwise, play/stop the assigned item
      if (isPlaying) {
        stop()
      } else {
        play(hotkey.assignedItem)
      }
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Don't allow drops when in unassign mode
    if (isUnassignMode) return
    
    if (draggedItem) {
      assignToHotkey(hotkey.bankId, hotkey.position, {
        type: draggedItem.type as 'audio' | 'playlist',
        id: draggedItem.id
      })
      
      setDraggedItem(null)
    }
  }
  
  const getLabel = () => {
    if (!hotkey.assignedItem) return ''
    
    let label = ''
    
    if (hotkey.assignedItem.type === 'audio') {
      const audio = getAudioById(hotkey.assignedItem.id)
      label = audio?.name || 'Unknown audio'
    } else if (hotkey.assignedItem.type === 'playlist') {
      const playlist = playlists.find(p => p.id === hotkey.assignedItem?.id)
      label = playlist?.name || 'Unknown playlist'
    }
    
    // Convert underscores to spaces
    return label.replace(/_/g, ' ')
  }
  
  const getIcon = () => {
    if (!hotkey.assignedItem) return null
    
    if (hotkey.assignedItem.type === 'audio') {
      return <Music size={20} className="mb-1" />
    } else if (hotkey.assignedItem.type === 'playlist') {
      return <ListMusic size={20} className="mb-1" />
    }
    
    return null
  }
  
  const getTrackLength = () => {
    if (!hotkey.assignedItem) return null
    
    if (hotkey.assignedItem.type === 'audio') {
      const audio = getAudioById(hotkey.assignedItem.id)
      if (audio) {
        const duration = getEffectiveDuration(audio)
        return formatTime(duration)
      }
    } else if (hotkey.assignedItem.type === 'playlist') {
      const playlist = playlists.find(p => p.id === hotkey.assignedItem?.id)
      if (playlist) {
        const totalDuration = playlist.items.reduce((total, item) => {
          const audio = getAudioById(item.audioId)
          return total + (audio ? getEffectiveDuration(audio) : 0)
        }, 0)
        return formatTime(totalDuration)
      }
    }
    
    return null
  }
  
  // Format time as MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    
    return `${minutes}:${String(seconds).padStart(2, '0')}`
  }
  
  // Decide if the hotkey should show an active/targetable state
  const isTargetable = !hotkey.assignedItem && selectedItem !== null && !isUnassignMode;
  
  const buttonClass = hotkey.assignedItem
    ? `w-full h-full rounded flex flex-col items-center justify-center p-1 transition-colors relative
       ${isPlaying 
           ? 'bg-yellow-500 text-black' 
           : 'bg-blue-700 hover:bg-blue-600 text-white'
       }`
    : `w-full h-full rounded flex items-center justify-center p-1 relative
       ${isTargetable 
          ? 'bg-blue-900 hover:bg-blue-800' 
          : 'bg-gray-800 hover:bg-gray-700'
       }`
  
  return (
    <div 
      className="relative w-full h-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <button
        className={buttonClass}
        onClick={handleClick}
      >
        {hotkey.assignedItem ? (
          <>
            <div className="flex flex-col items-center justify-center h-full">
              {getIcon()}
              <span className="font-bold text-center break-words w-full px-1 text-xs sm:text-sm">{getLabel()}</span>
            </div>
            
            {/* Track length in bottom left */}
            <div className="absolute bottom-1 left-1 text-xs opacity-70">
              {getTrackLength()}
            </div>
            
            {/* Hotkey number in bottom right */}
            <div className="absolute bottom-1 right-1 text-xs opacity-70">
              {hotkey.position}
            </div>
            
            {/* Show X icon when in unassign mode */}
            {isUnassignMode && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
                <X size={24} className="text-red-500" />
              </div>
            )}
          </>
        ) : (
          <>
            <div className="text-gray-500 text-sm absolute bottom-1 right-1">
              {hotkey.position}
            </div>
            {isTargetable && (
              <div className="text-blue-400 text-sm">
                Tap to assign
              </div>
            )}
          </>
        )}
      </button>
    </div>
  )
}
