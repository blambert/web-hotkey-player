import { MouseEvent } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { useDnd } from '../contexts/DndContext'
import { HotKey } from '../types'
import { Music, ListMusic } from 'lucide-react'

interface HotKeyButtonProps {
  hotkey: HotKey | undefined
  isPlaying: boolean
}

export default function HotKeyButton({ hotkey, isPlaying }: HotKeyButtonProps) {
  const { play, stop, getAudioById, assignToHotkey, clearHotkey, playbackStatus, playlists } = useAudio()
  const { draggedItem, setDraggedItem } = useDnd()
  
  if (!hotkey) return null
  
  const handleClick = () => {
    if (!hotkey.assignedItem) return
    
    if (isPlaying) {
      stop()
    } else {
      play(hotkey.assignedItem)
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (draggedItem) {
      assignToHotkey(hotkey.bankId, hotkey.position, {
        type: draggedItem.type as 'audio' | 'playlist',
        id: draggedItem.id
      })
      
      setDraggedItem(null)
    }
  }
  
  const handleClear = (e: MouseEvent) => {
    e.stopPropagation()
    clearHotkey(hotkey.bankId, hotkey.position)
  }
  
  const getLabel = () => {
    if (!hotkey.assignedItem) return ''
    
    if (hotkey.assignedItem.type === 'audio') {
      const audio = getAudioById(hotkey.assignedItem.id)
      return audio?.name || 'Unknown audio'
    } else if (hotkey.assignedItem.type === 'playlist') {
      const playlist = playlists.find(p => p.id === hotkey.assignedItem?.id)
      return playlist?.name || 'Unknown playlist'
    }
    
    return ''
  }
  
  const getIcon = () => {
    if (!hotkey.assignedItem) return null
    
    if (hotkey.assignedItem.type === 'audio') {
      return <Music size={16} className="mr-1 flex-shrink-0" />
    } else if (hotkey.assignedItem.type === 'playlist') {
      return <ListMusic size={16} className="mr-1 flex-shrink-0" />
    }
    
    return null
  }
  
  const buttonClass = hotkey.assignedItem
    ? `w-full h-16 rounded flex flex-col items-center justify-center p-1 transition-colors
       ${isPlaying 
           ? 'bg-green-700 text-white' 
           : hotkey.assignedItem.type === 'audio' 
               ? 'bg-blue-700 hover:bg-blue-600 text-white'
               : 'bg-green-700 hover:bg-green-600 text-white'
       }`
    : 'w-full h-16 rounded bg-gray-800 hover:bg-gray-700 flex items-center justify-center p-1'
  
  return (
    <div 
      className="relative group w-full"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <button
        className={buttonClass}
        onClick={handleClick}
      >
        {hotkey.assignedItem ? (
          <>
            <div className="flex items-center text-xs truncate w-full">
              {getIcon()}
              <span className="truncate">{getLabel()}</span>
            </div>
            <div className="text-xs opacity-70">
              {hotkey.bankId}-{hotkey.position}
            </div>
          </>
        ) : (
          <div className="text-gray-500 text-sm">
            {hotkey.bankId}-{hotkey.position}
          </div>
        )}
      </button>
      
      {hotkey.assignedItem && (
        <button
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
          onClick={handleClear}
        >
          ×
        </button>
      )}
    </div>
  )
}
