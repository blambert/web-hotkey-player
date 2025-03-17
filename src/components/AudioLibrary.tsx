import { useRef, useState } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { useDnd } from '../contexts/DndContext'
import { AudioFile } from '../types'
import { Music, Play, Trash2, Clock, Scissors } from 'lucide-react'
import AudioTrimEditor from './AudioTrimEditor'

export default function AudioLibrary() {
  const { 
    audioFiles, 
    addAudioFile, 
    play, 
    deleteAudioFile,
    getEffectiveDuration
  } = useAudio()
  
  const { setDraggedItem } = useDnd()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingAudio, setEditingAudio] = useState<AudioFile | null>(null)
  const [isProcessingFiles, setIsProcessingFiles] = useState(false)
  
  // Sort audio files alphabetically by name
  const sortedAudioFiles = [...audioFiles].sort((a, b) => 
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )
  
  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    
    if (files && files.length > 0) {
      setIsProcessingFiles(true)
      
      try {
        // Convert FileList to Array for easier handling
        const fileArray = Array.from(files)
        
        // Process all files in parallel
        await Promise.all(
          fileArray.map(async (file) => {
            // Check if file is audio
            if (!file.type.startsWith('audio/')) {
              console.warn(`File ${file.name} is not an audio file`)
              return
            }
            
            try {
              await addAudioFile(file)
            } catch (error) {
              console.error(`Failed to add audio file ${file.name}:`, error)
            }
          })
        )
      } finally {
        setIsProcessingFiles(false)
      }
      
      // Reset file input
      e.target.value = ''
    }
  }
  
  const handleDragStart = (audioFile: AudioFile) => {
    setDraggedItem({
      type: 'audio',
      id: audioFile.id
    })
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
  }
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    setIsProcessingFiles(true)
    
    try {
      // Get all files from the drop event
      const items = e.dataTransfer.items
      const droppedFiles: File[] = []
      
      // Collect files from DataTransferItemList if available (more reliable for external drops)
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.kind === 'file') {
            const file = item.getAsFile()
            if (file) droppedFiles.push(file)
          }
        }
      }
      
      // Fallback to files property if items didn't work
      if (droppedFiles.length === 0) {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          droppedFiles.push(e.dataTransfer.files[i])
        }
      }
      
      // Process all collected files in parallel
      await Promise.all(
        droppedFiles.map(async (file) => {
          // Check if file is audio
          if (!file.type.startsWith('audio/')) {
            console.warn(`File ${file.name} is not an audio file`)
            return
          }
          
          try {
            await addAudioFile(file)
          } catch (error) {
            console.error(`Failed to add audio file ${file.name}:`, error)
          }
        })
      )
    } finally {
      setIsProcessingFiles(false)
    }
  }
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }
  
  return (
    <div 
      className="p-2 flex flex-col"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs text-gray-400">{audioFiles.length} files</div>
        <button 
          className="text-xs px-2 py-1 bg-blue-600 rounded text-white hover:bg-blue-700"
          onClick={handleBrowseClick}
          disabled={isProcessingFiles}
        >
          {isProcessingFiles ? 'Processing...' : 'Browse Files'}
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {sortedAudioFiles.map(audio => {
          // Calculate effective duration (accounting for trims)
          const effectiveDuration = getEffectiveDuration(audio);
          
          return (
            <div 
              key={audio.id}
              className="p-2 mb-1 bg-gray-800 rounded hover:bg-gray-700 cursor-grab"
              draggable
              onDragStart={() => handleDragStart(audio)}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <Music size={14} className="text-blue-400 mr-1" />
                  <div className="text-sm font-medium truncate max-w-[150px]">{audio.name}</div>
                </div>
                
                <div className="flex space-x-1">
                  <button 
                    className="p-1 rounded hover:bg-gray-600"
                    onClick={() => play({ type: 'audio', id: audio.id })}
                  >
                    <Play size={14} />
                  </button>
                  
                  <button 
                    className="p-1 rounded hover:bg-gray-600"
                    onClick={() => setEditingAudio(audio)}
                  >
                    <Scissors size={14} />
                  </button>
                  
                  <button 
                    className="p-1 rounded hover:bg-gray-600 text-red-400"
                    onClick={() => deleteAudioFile(audio.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center text-xs text-gray-400 justify-between">
                <div className="flex items-center">
                  <Clock size={12} className="mr-1" />
                  {formatDuration(effectiveDuration)}
                  {(audio.trimHead > 0 || audio.trimTail > 0) && (
                    <span className="ml-1 text-yellow-500">
                      (trimmed)
                    </span>
                  )}
                </div>
                
                <div className="flex items-center">
                  {audio.volume < 1 ? `${Math.round(audio.volume * 100)}%` : "100%"}
                </div>
              </div>
              
              {audio.trimHead > 0 || audio.trimTail > 0 ? (
                <div className="mt-1 text-xs text-yellow-500">
                  Trimmed: {audio.trimHead > 0 ? `Head: ${audio.trimHead.toFixed(2)}s` : ''}
                  {audio.trimHead > 0 && audio.trimTail > 0 ? ' | ' : ''}
                  {audio.trimTail > 0 ? `Tail: ${audio.trimTail.toFixed(2)}s` : ''}
                </div>
              ) : null}
            </div>
          );
        })}
        
        {audioFiles.length === 0 && !isProcessingFiles && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p className="mb-2">No audio files yet</p>
            <p className="text-xs text-center">Click to browse or drop files here</p>
            <p className="text-xs text-center">Supports MP3 and WAV files</p>
          </div>
        )}
        
        {isProcessingFiles && (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500">
            <p className="mb-2">Processing files...</p>
            <p className="text-xs text-center">Please wait while your audio files are being processed</p>
          </div>
        )}
      </div>
      
      <input 
        type="file" 
        ref={fileInputRef}
        className="hidden"
        accept="audio/*"
        onChange={handleFileChange}
        multiple
      />
      
      {editingAudio && (
        <AudioTrimEditor 
          audio={editingAudio}
          onClose={() => setEditingAudio(null)}
        />
      )}
    </div>
  )
}
