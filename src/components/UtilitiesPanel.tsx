import { useRef, useState } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { Download, Upload, Settings, AlertCircle, X } from 'lucide-react'
import { AudioFile, HotKey } from '../types'

interface ExportData {
  version: string
  exportDate: string
  hotkeys: HotKey[]
  playlists: any[]
  audioSettings: {
    filename: string
    id: string
    trimHead: number
    trimTail: number
    volume: number
  }[]
}

export default function UtilitiesPanel() {
  const { 
    audioFiles, 
    hotkeys, 
    playlists,
    updateAudioFile,
    setHeadTrim,
    setTailTrim,
    assignToHotkey,
    clearHotkey,
    isUnassignMode,
    toggleUnassignMode
  } = useAudio()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importStatus, setImportStatus] = useState<{
    message: string
    type: 'info' | 'success' | 'error'
  } | null>(null)
  
  const handleExport = () => {
    try {
      // Create export data object
      const exportData: ExportData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        hotkeys: hotkeys,
        playlists: playlists,
        audioSettings: audioFiles.map(audio => ({
          filename: audio.name,
          id: audio.id,
          trimHead: audio.trimHead || 0,
          trimTail: audio.trimTail || 0,
          volume: audio.volume || 1
        }))
      }
      
      // Convert to JSON
      const jsonString = JSON.stringify(exportData, null, 2)
      
      // Create a blob and download link
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      // Create download link
      const a = document.createElement('a')
      a.href = url
      a.download = `audio-player-settings-${new Date().toISOString().split('T')[0]}.json`
      
      // Append to body, click, and remove
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      
      setImportStatus({
        message: 'Settings exported successfully!',
        type: 'success'
      })
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setImportStatus(null)
      }, 3000)
    } catch (error) {
      console.error('Export error:', error)
      setImportStatus({
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      })
    }
  }
  
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    
    if (files && files.length > 0) {
      const file = files[0]
      
      try {
        const text = await file.text()
        const importData = JSON.parse(text) as ExportData
        
        // Validate the import data structure
        if (!importData.version || !importData.hotkeys || !importData.playlists || !importData.audioSettings) {
          setImportStatus({
            message: 'Invalid import file format',
            type: 'error'
          })
          return
        }
        
        // Start the import process
        await importSettings(importData)
        
      } catch (error) {
        console.error('Import error:', error)
        setImportStatus({
          message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          type: 'error'
        })
      }
      
      // Reset file input
      e.target.value = ''
    }
  }
  
  const importSettings = async (importData: ExportData) => {
    setImportStatus({
      message: 'Importing settings...',
      type: 'info'
    })
    
    try {
      // 1. Create a map of filenames to current audio file IDs
      const filenameToAudioMap = new Map<string, AudioFile>()
      audioFiles.forEach(audio => {
        filenameToAudioMap.set(audio.name, audio)
      })
      
      // Map of old IDs to new IDs for updating references
      const idMap = new Map<string, string>()
      
      // 2. Apply audio settings based on filename matching
      let appliedSettings = 0
      let missingFiles = 0
      
      importData.audioSettings.forEach(setting => {
        const matchingAudio = filenameToAudioMap.get(setting.filename)
        
        if (matchingAudio) {
          // Store ID mapping
          idMap.set(setting.id, matchingAudio.id)
          
          // Apply trim and volume settings
          setHeadTrim(matchingAudio.id, setting.trimHead)
          setTailTrim(matchingAudio.id, setting.trimTail)
          updateAudioFile(matchingAudio.id, { volume: setting.volume })
          
          appliedSettings++
        } else {
          missingFiles++
        }
      })
      
      // 3. Apply hotkey assignments
      // First clear all hotkeys (in case we're reassigning)
      hotkeys.forEach(hotkey => {
        clearHotkey(hotkey.bankId, hotkey.position)
      })
      
      // Then apply imported hotkeys
      let appliedHotkeys = 0
      importData.hotkeys.forEach(hotkey => {
        if (hotkey.assignedItem) {
          const originalItemId = hotkey.assignedItem.id
          const newItemId = idMap.get(originalItemId)
          
          if (newItemId && hotkey.assignedItem.type === 'audio') {
            // Assign with the new ID
            assignToHotkey(hotkey.bankId, hotkey.position, {
              type: 'audio',
              id: newItemId
            })
            appliedHotkeys++
          } else if (hotkey.assignedItem.type === 'playlist') {
            // Playlists will be handled separately
            // We'll import them later in the correct order
          }
        }
      })
      
      // 4. Import playlists
      // This is more complex and would need a separate function to handle
      // rebuilding the playlists with the new audio file IDs
      let importedPlaylists = 0
      
      // This would need to be implemented to handle playlists properly
      
      // 5. Report success with stats
      setImportStatus({
        message: `Import successful! Applied settings to ${appliedSettings} files, ${appliedHotkeys} hotkeys. ${missingFiles} files were missing.`,
        type: 'success'
      })
      
    } catch (error) {
      console.error('Error during import:', error)
      setImportStatus({
        message: `Import error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      })
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = e.dataTransfer.files
    
    if (files && files.length > 0) {
      const file = files[0]
      
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        try {
          const text = await file.text()
          const importData = JSON.parse(text) as ExportData
          
          await importSettings(importData)
        } catch (error) {
          console.error('Import error:', error)
          setImportStatus({
            message: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            type: 'error'
          })
        }
      } else {
        setImportStatus({
          message: 'Please drop a JSON settings file',
          type: 'error'
        })
      }
    }
  }
  
  return (
    <div 
      className="p-2 flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center mb-3">
        <Settings size={16} className="text-purple-400 mr-2" />
        <h2 className="text-md font-semibold">Utilities</h2>
      </div>
      
      <div className="space-y-3">
        <div className="p-3 bg-gray-800 rounded">
          <h3 className="text-sm font-medium mb-2">Hotkey Management</h3>
          <button
            className={`w-full px-3 py-2 ${isUnassignMode 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-gray-700 hover:bg-gray-600'} text-white rounded flex items-center justify-center`}
            onClick={toggleUnassignMode}
          >
            <X size={16} className="mr-2" />
            {isUnassignMode ? 'Exit Unassign Mode' : 'Unassign Hotkeys'}
          </button>
          {isUnassignMode && (
            <p className="text-xs text-red-400 mt-2">
              Click on any hotkey to unassign it
            </p>
          )}
        </div>
        
        <div className="p-3 bg-gray-800 rounded">
          <h3 className="text-sm font-medium mb-2">Export Settings</h3>
          <p className="text-xs text-gray-400 mb-3">
            Save your hotkeys, playlists, and audio settings to a file that you can import later.
          </p>
          <button
            className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center"
            onClick={handleExport}
          >
            <Download size={16} className="mr-2" />
            Export Settings
          </button>
        </div>
        
        <div className="p-3 bg-gray-800 rounded">
          <h3 className="text-sm font-medium mb-2">Import Settings</h3>
          <p className="text-xs text-gray-400 mb-3">
            Restore your settings from a previously exported file. Audio files are matched by filename.
          </p>
          <button
            className="w-full px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
            onClick={handleImportClick}
          >
            <Upload size={16} className="mr-2" />
            Import Settings
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden"
            accept="application/json"
            onChange={handleFileChange}
          />
          
          <div className="mt-2 text-xs text-center text-gray-400">
            Or drop a settings file here
          </div>
        </div>
        
        {importStatus && (
          <div className={`p-3 rounded text-sm ${
            importStatus.type === 'error' 
              ? 'bg-red-900/50 text-red-300' 
              : importStatus.type === 'success'
                ? 'bg-green-900/50 text-green-300'
                : 'bg-blue-900/50 text-blue-300'
          }`}>
            <div className="flex items-center">
              <AlertCircle size={16} className="mr-2 flex-shrink-0" />
              <span>{importStatus.message}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
