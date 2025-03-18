import { useState } from 'react'
import { Music, ListMusic, Settings } from 'lucide-react'
import AudioLibrary from './AudioLibrary'
import PlaylistManager from './PlaylistManager'
import UtilitiesPanel from './UtilitiesPanel'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/Tabs'

export default function RightPanel() {
  const [sectionStates, setSectionStates] = useState({
    audio: false,
    playlists: false,
    utilities: false
  })
  
  const toggleSection = (section: keyof typeof sectionStates) => {
    setSectionStates(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Audio Library Section */}
      <div className="mb-2">
        <div 
          className="px-3 py-2 bg-gray-800 rounded-t flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('audio')}
        >
          <div className="flex items-center">
            <Music size={18} className="text-blue-500 mr-2" />
            <h2 className="text-md font-semibold">Audio Library</h2>
          </div>
          <div className="text-xs text-gray-400">
            {sectionStates.audio ? '▼' : '►'}
          </div>
        </div>
        
        {sectionStates.audio && (
          <div className="bg-gray-900 rounded-b overflow-hidden">
            <AudioLibrary />
          </div>
        )}
      </div>
      
      {/* Playlists Section */}
      <div className="mb-2">
        <div 
          className="px-3 py-2 bg-gray-800 rounded-t flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('playlists')}
        >
          <div className="flex items-center">
            <ListMusic size={18} className="text-green-500 mr-2" />
            <h2 className="text-md font-semibold">Playlists</h2>
          </div>
          <div className="text-xs text-gray-400">
            {sectionStates.playlists ? '▼' : '►'}
          </div>
        </div>
        
        {sectionStates.playlists && (
          <div className="bg-gray-900 rounded-b overflow-hidden">
            <PlaylistManager />
          </div>
        )}
      </div>
      
      {/* Utilities Section */}
      <div>
        <div 
          className="px-3 py-2 bg-gray-800 rounded-t flex items-center justify-between cursor-pointer"
          onClick={() => toggleSection('utilities')}
        >
          <div className="flex items-center">
            <Settings size={18} className="text-purple-400 mr-2" />
            <h2 className="text-md font-semibold">Utilities</h2>
          </div>
          <div className="text-xs text-gray-400">
            {sectionStates.utilities ? '▼' : '►'}
          </div>
        </div>
        
        {sectionStates.utilities && (
          <div className="bg-gray-900 rounded-b overflow-hidden">
            <UtilitiesPanel />
          </div>
        )}
      </div>
    </div>
  )
}
