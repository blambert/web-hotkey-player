import { useState } from 'react'
import HotKeyPanel from './components/HotKeyPanel'
import PlaybackBar from './components/PlaybackBar'
import RightPanel from './components/RightPanel'
import { AudioContextProvider } from './contexts/AudioContext'
import { DndProvider } from './contexts/DndContext'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function App() {
  const [showRightPanel, setShowRightPanel] = useState(true)

  return (
    <AudioContextProvider>
      <DndProvider>
        <div className="flex flex-col h-screen bg-gray-900 text-white overflow-hidden">
          <div className="flex-none">
            <PlaybackBar />
          </div>
          
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto">
              <HotKeyPanel />
            </div>
            
            {showRightPanel && (
              <div className="w-80 border-l border-gray-700 overflow-y-auto">
                <RightPanel />
              </div>
            )}
            
            <button 
              className="flex-none w-6 bg-gray-800 hover:bg-gray-700 flex items-center justify-center cursor-pointer transition-colors border-l border-gray-700"
              onClick={() => setShowRightPanel(!showRightPanel)}
            >
              {showRightPanel ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>
        </div>
      </DndProvider>
    </AudioContextProvider>
  )
}

export default App
