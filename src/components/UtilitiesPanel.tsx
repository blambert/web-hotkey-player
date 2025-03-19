import { useRef } from 'react'
import { Download, Upload, Settings, X } from 'lucide-react'
import { useAudio } from '../contexts/AudioContext'
import { exportSettings, importSettings, ExportedSettings } from '../services/settingsService'

export default function UtilitiesPanel() {
  const { 
    audioFiles, 
    updateAudioFile, 
    playlists, 
    createPlaylist, 
    updatePlaylist, 
    addToPlaylist,
    hotkeys,
    assignToHotkey,
    isUnassignMode,
    toggleUnassignMode
  } = useAudio()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const handleExportSettings = () => {
    // Generate settings export
    const settings = exportSettings(audioFiles, playlists, hotkeys)
    
    // Convert to JSON and create a blob
    const settingsJson = JSON.stringify(settings, null, 2)
    const blob = new Blob([settingsJson], { type: 'application/json' })
    
    // Create download link and trigger download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'hotkey-player-settings.json'
    document.body.appendChild(link)
    link.click()
    
    // Clean up
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
  
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    
    if (file) {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const settings = JSON.parse(e.target?.result as string) as ExportedSettings
          
          // Import settings and get list of missing files
          const missingFiles = importSettings(
            settings,
            audioFiles,
            playlists,
            updateAudioFile,
            createPlaylist,
            updatePlaylist,
            addToPlaylist,
            assignToHotkey
          )
          
          // Alert if there are missing files
          if (missingFiles.length > 0) {
            alert(`Warning: The following audio files in the settings file were not found in your library:\n\n${missingFiles.join('\n')}`)
          } else {
            alert('Settings imported successfully!')
          }
        } catch (error) {
          console.error('Failed to import settings:', error)
          alert('Failed to import settings. The file may be corrupt or in an invalid format.')
        }
      }
      
      reader.readAsText(file)
      
      // Reset input
      e.target.value = ''
    }
  }
  
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">Utilities</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="font-medium mb-2 flex items-center">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </h3>
          
          <div className="flex space-x-2">
            <button 
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center hover:bg-blue-700"
              onClick={handleExportSettings}
            >
              <Download className="mr-1 h-4 w-4" />
              Export
            </button>
            
            <button 
              className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm flex items-center hover:bg-blue-700"
              onClick={handleImportClick}
            >
              <Upload className="mr-1 h-4 w-4" />
              Import
            </button>
            
            <input 
              type="file" 
              ref={fileInputRef}
              className="hidden"
              accept=".json"
              onChange={handleFileChange}
            />
          </div>
        </div>
        
        {/* Unassign Hotkeys section */}
        <div className="bg-gray-800 p-3 rounded">
          <h3 className="font-medium mb-2 flex items-center">
            <X className="mr-2 h-4 w-4" />
            Hotkey Management
          </h3>
          
          <div className="flex space-x-2">
            <button 
              className={`px-3 py-1.5 rounded text-sm flex items-center ${
                isUnassignMode 
                  ? 'bg-red-600 hover:bg-red-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
              onClick={toggleUnassignMode}
            >
              <X className="mr-1 h-4 w-4" />
              {isUnassignMode ? 'Exit Unassign Mode' : 'Unassign Hotkeys'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
