import { useState } from 'react'
import HotKeyPanel from './components/HotKeyPanel'
import PlaybackBar from './components/PlaybackBar'
import RightPanel from './components/RightPanel'
import { AudioContextProvider } from './contexts/AudioContext'
import { DndProvider } from './contexts/DndContext'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useAudio } from './contexts/AudioContext'

// Loading component that shows while data is being loaded from IndexedDB
function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center">
        <Loader2 size={48} className="animate-spin mx-auto mb-4 text-blue-500" />
        <h2 className="text-xl font-semibold mb-2">Loading your audio library</h2>
        <p className="text-gray-400">Please wait while we load your data...</p>
      </div>
    </div>
  );
}

// Component for the app content
function AppContent() {
  const [showRightPanel, setShowRightPanel] = useState(true)
  const { isLoading } = useAudio()

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
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
  );
}

function App() {
  return (
    <AudioContextProvider>
      <DndProvider>
        <AppContent />
      </DndProvider>
    </AudioContextProvider>
  )
}

export default App
