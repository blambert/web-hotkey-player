import { useMemo } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { useDnd } from '../contexts/DndContext'
import HotKeyButton from './HotKeyButton'
import BankSelector from './BankSelector'

export default function HotKeyPanel() {
  const { 
    banks, 
    hotkeysPerBank, 
    currentBank, 
    setCurrentBank, 
    hotkeys,
    playbackStatus
  } = useAudio()
  
  const { draggedItem } = useDnd()
  
  // Get hotkeys for current bank
  const currentBankHotkeys = useMemo(() => {
    return hotkeys.filter(hotkey => hotkey.bankId === currentBank)
  }, [hotkeys, currentBank])
  
  // Calculate grid layout
  const gridLayout = useMemo(() => {
    const rows = 4
    const cols = 6
    
    const grid = []
    
    for (let row = 0; row < rows; row++) {
      const rowHotkeys = []
      
      for (let col = 0; col < cols; col++) {
        const position = row * cols + col + 1
        const hotkey = currentBankHotkeys.find(h => h.position === position)
        
        rowHotkeys.push(hotkey)
      }
      
      grid.push(rowHotkeys)
    }
    
    return grid
  }, [currentBankHotkeys])
  
  return (
    <div className="p-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <BankSelector 
          banks={banks}
          currentBank={currentBank}
          setCurrentBank={setCurrentBank}
        />
      </div>
      
      <div className="mt-4 flex-grow grid grid-rows-4 gap-2">
        {gridLayout.map((row, rowIndex) => (
          <div key={`row-${rowIndex}`} className="grid grid-cols-6 gap-2 h-full">
            {row.map((hotkey) => (
              <HotKeyButton 
                key={hotkey?.id} 
                hotkey={hotkey} 
                isPlaying={
                  playbackStatus.isPlaying && 
                  hotkey?.assignedItem?.id === 
                  (playbackStatus.currentItem?.type === 'audio' 
                    ? playbackStatus.currentAudioId 
                    : playbackStatus.currentPlaylistId)
                }
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
