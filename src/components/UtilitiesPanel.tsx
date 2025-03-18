import { useState, useRef } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { AudioFile, Playlist, PlaylistItem, HotKey } from '../types'
import { Download, Upload, Save, RefreshCw, Trash2 } from 'lucide-react'

export default function UtilitiesPanel() {
  const { 
    audioFiles, 
    hotkeys, 
    playlists,
    createPlaylist,
    updatePlaylist,
    addToPlaylist,
    assignToHotkey,
    addAudioFile,
    isUnassignMode,
    toggleUnassignMode
  } = useAudio()
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  
  // Export data as JSON file
  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Create export data object - we only include necessary data
      const exportData = {
        audioFiles: audioFiles.map(audio => ({
          id: audio.id,
          name: audio.name,
          duration: audio.duration,
          volume: audio.volume,
          type: audio.type,
          trimHead: audio.trimHead,
          trimTail: audio.trimTail
        })),
        hotkeys: hotkeys.filter(hotkey => hotkey.assignedItem !== null),
        playlists
      }
      
      // Convert to JSON string
      const jsonString = JSON.stringify(exportData, null, 2)
      
      // Create blob and download
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      // Create link and trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = `soundboard-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }
  
  // Trigger file input for import
  const handleImportClick = () => {
    fileInputRef.current?.click()
  }
  
  // Process imported file
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setIsImporting(true)
      
      const file = e.target.files?.[0]
      if (!file) return
      
      // Read file
      const text = await file.text()
      const importData = JSON.parse(text)
      
      // Validate import data
      if (!importData.audioFiles || !Array.isArray(importData.audioFiles)) {
        throw new Error('Invalid import data: missing audio files')
      }
      
      // Import audio files first
      const audioIdMap = new Map<string, string>() // Map old IDs to new IDs
      
      // Import audio files
      for (const importedAudio of importData.audioFiles) {
        try {
          // Create a dummy file to represent the imported audio
          // This is just a placeholder as we don't have the actual audio data
          const dummyFile = new File(
            ['(Audio content not available in import)'], 
            importedAudio.name + '.mp3', 
            { type: importedAudio.type || 'audio/mpeg' }
          )
          
          // Add the audio file to the system
          const newAudio = await addAudioFile(dummyFile)
          
          // Update audio properties
          newAudio.duration = importedAudio.duration || 0
          newAudio.volume = importedAudio.volume || 1
          newAudio.trimHead = importedAudio.trimHead || 0
          newAudio.trimTail = importedAudio.trimTail || 0
          
          // Map the old ID to the new ID
          audioIdMap.set(importedAudio.id, newAudio.id)
        } catch (error) {
          console.error(`Failed to import audio file ${importedAudio.name}:`, error)
          // Continue with other files
        }
      }
      
      // Import playlists
      if (importData.playlists && Array.isArray(importData.playlists)) {
        for (const importedPlaylist of importData.playlists) {
          try {
            // Create new playlist
            const newPlaylist = createPlaylist(importedPlaylist.name)
            
            // Add items to playlist with mapped audio IDs
            if (importedPlaylist.items && Array.isArray(importedPlaylist.items)) {
              for (const item of importedPlaylist.items) {
                const newAudioId = audioIdMap.get(item.audioId)
                if (newAudioId) {
                  addToPlaylist(newPlaylist.id, newAudioId)
                }
              }
            }
            
            // Update playlist properties
            updatePlaylist(newPlaylist.id, {
              playbackMode: importedPlaylist.playbackMode || 'follow-on'
            })
          } catch (error) {
            console.error(`Failed to import playlist ${importedPlaylist.name}:`, error)
            // Continue with other playlists
          }
        }
      }
      
      // Import hotkeys
      if (importData.hotkeys && Array.isArray(importData.hotkeys)) {
        for (const importedHotkey of importData.hotkeys) {
          try {
            if (!importedHotkey.assignedItem) continue
            
            const assignedItem = importedHotkey.assignedItem
            let newAssignedItem = null
            
            if (assignedItem.type === 'audio') {
              const newAudioId = audioIdMap.get(assignedItem.id)
              if (newAudioId) {
                newAssignedItem = {
                  type: 'audio',
                  id: newAudioId
                }
              }
            } else if (assignedItem.type === 'playlist') {
              // Note: We currently don't map playlist IDs, so playlist assignments won't work
              // This would require mapping playlist IDs similar to audio IDs
              console.warn('Playlist hotkey assignments not supported in import')
            }
            
            if (newAssignedItem) {
              assignToHotkey(
                importedHotkey.bankId, 
                importedHotkey.position, 
                newAssignedItem
              )
            }
          } catch (error) {
            console.error(`Failed to import hotkey:`, error)
            // Continue with other hotkeys
          }
        }
      }
      
      alert('Import completed. Note: Audio files are placeholders only, you will need to add the actual audio files separately.')
    } catch (error) {
      console.error('Import failed:', error)
      alert('Import failed. Please check the file format and try again.')
    } finally {
      setIsImporting(false)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }
  
  return (
    <div className="p-4">
      <div className="space-y-4">
        <div>
          <button 
            className={`w-full p-2 rounded ${
              isUnassignMode 
                ? 'bg-red-600 hover:bg-red-500' 
                : 'bg-gray-600 hover:bg-gray-500'
            } flex items-center justify-center`}
            onClick={toggleUnassignMode}
          >
            {isUnassignMode ? (
              <>
                <Trash2 size={16} className="mr-2" />
                Cancel Unassign
              </>
            ) : (
              <>
                <Trash2 size={16} className="mr-2" />
                Unassign Hotkeys
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-1">
            {isUnassignMode 
              ? 'Click on any hotkey to unassign it.' 
              : 'Enable unassign mode to remove hotkey assignments.'}
          </p>
        </div>
        
        <div>
          <button 
            className="w-full p-2 rounded bg-blue-600 hover:bg-blue-500 flex items-center justify-center"
            onClick={handleExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={16} className="mr-2" />
                Export Settings
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-1">
            Export your hotkeys, playlists, and audio settings.
          </p>
        </div>
        
        <div>
          <button 
            className="w-full p-2 rounded bg-green-600 hover:bg-green-500 flex items-center justify-center"
            onClick={handleImportClick}
            disabled={isImporting}
          >
            {isImporting ? (
              <>
                <RefreshCw size={16} className="mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Import Settings
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 mt-1">
            Import hotkeys, playlists, and audio settings from a previous export.
          </p>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden"
          accept=".json"
          onChange={handleImport}
        />
      </div>
    </div>
  )
}
