import { useState, useEffect, useRef } from 'react'
import { useAudio } from '../contexts/AudioContext'
import { AudioFile } from '../types'
import { Scissors, Save, X, Volume2, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface AudioTrimEditorProps {
  audio: AudioFile
  onClose: () => void
}

export default function AudioTrimEditor({ audio, onClose }: AudioTrimEditorProps) {
  const { setHeadTrim, setTailTrim, getEffectiveDuration, updateAudioFile } = useAudio()
  
  const [headTrim, setHeadTrimValue] = useState(audio.trimHead)
  const [tailTrim, setTailTrimValue] = useState(audio.trimTail)
  const [volume, setVolume] = useState(audio.volume)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  
  // Calculate effective duration
  const effectiveDuration = getEffectiveDuration(audio)
  
  // Initialize audio
  useEffect(() => {
    if (!audioRef.current) return
    
    audioRef.current.src = audio.src
    audioRef.current.volume = volume
    
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
        
        // Check if we've reached the tail trim point
        if (tailTrim > 0 && audioRef.current.currentTime >= (audio.duration - tailTrim)) {
          audioRef.current.pause()
          setIsPlaying(false)
        }
      }
    }
    
    const handleEnded = () => {
      setIsPlaying(false)
    }
    
    audioRef.current.addEventListener('timeupdate', handleTimeUpdate)
    audioRef.current.addEventListener('ended', handleEnded)
    
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate)
        audioRef.current.removeEventListener('ended', handleEnded)
        audioRef.current.pause()
      }
    }
  }, [audio, tailTrim, volume])
  
  // Update audio volume when the volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);
  
  const handlePlay = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      // Start from head trim position if at beginning, otherwise continue from current position
      if (currentTime < headTrim || currentTime > audio.duration - tailTrim) {
        audioRef.current.currentTime = headTrim
      }
      audioRef.current.play().catch(console.error)
      setIsPlaying(true)
    }
  }
  
  const handleSave = () => {
    setHeadTrim(audio.id, headTrim)
    setTailTrim(audio.id, tailTrim)
    updateAudioFile(audio.id, { volume }) // Save volume as well
    onClose()
  }
  
  // Format time as MM:SS.ms
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    const ms = Math.floor((seconds % 1) * 100)
    
    return `${minutes}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
  }
  
  // Set head trim to current playback position
  const setHeadTrimToCurrentTime = () => {
    if (!audioRef.current) return
    const newHeadTrim = audioRef.current.currentTime
    
    // Ensure head trim doesn't overlap with tail trim
    const maxHeadTrim = audio.duration - tailTrim - 0.1
    const validHeadTrim = Math.min(newHeadTrim, maxHeadTrim)
    
    setHeadTrimValue(validHeadTrim)
    
    // If playing and current position is before new head trim, update playback position
    if (isPlaying && audioRef.current.currentTime < validHeadTrim) {
      audioRef.current.currentTime = validHeadTrim
    }
  }
  
  // Set tail trim to current playback position
  const setTailTrimToCurrentTime = () => {
    if (!audioRef.current) return
    const currentPos = audioRef.current.currentTime
    const newTailTrim = Math.max(0, audio.duration - currentPos)
    
    // Ensure tail trim doesn't overlap with head trim
    const maxTailTrim = audio.duration - headTrim - 0.1
    const validTailTrim = Math.min(newTailTrim, maxTailTrim)
    
    setTailTrimValue(validTailTrim)
  }
  
  // Calculate display position for playback indicator
  const getPlaybackPositionPercentage = () => {
    return (currentTime / audio.duration) * 100;
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-gray-800 rounded-lg w-full max-w-lg overflow-hidden">
        <div className="p-3 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center">
            <Scissors size={18} className="text-blue-500 mr-2" />
            <h2 className="text-lg font-bold">Trim "{audio.name}"</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-700">
            <X size={18} />
          </button>
        </div>
        
        <div className="p-4">
          {/* Volume Control - Moved to the top */}
          <div className="mb-4 p-2 bg-gray-700 rounded">
            <label className="block text-sm font-medium mb-1">Volume</label>
            <div className="flex items-center space-x-2">
              <Volume2 size={16} className="text-gray-400" />
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.01" 
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1 h-2"
              />
              <span className="text-white w-12 text-right">{Math.round(volume * 100)}%</span>
            </div>
          </div>
          
          <div className="mb-4">
            <div className="relative h-8 bg-gray-700 rounded-lg overflow-hidden">
              {/* Full audio track */}
              <div className="absolute h-full w-full bg-gray-600"></div>
              
              {/* Trimmed section */}
              <div 
                className="absolute h-full bg-blue-600"
                style={{ 
                  left: `${(headTrim / audio.duration) * 100}%`,
                  right: `${(tailTrim / audio.duration) * 100}%`
                }}
              ></div>
              
              {/* Current position indicator - shown whether playing or paused */}
              <div 
                className="absolute h-full w-0.5 bg-red-500"
                style={{ 
                  left: `${getPlaybackPositionPercentage()}%`
                }}
              ></div>
            </div>
            
            <div className="flex justify-between mt-1 text-xs">
              <span className="text-gray-400">0:00</span>
              <span className="text-white font-mono">Current: {formatTime(currentTime)}</span>
              <span className="text-gray-400">{formatTime(audio.duration)}</span>
            </div>
            
            <div className="flex justify-between mt-1 text-sm">
              <span className="text-green-500">
                Effective Duration: {formatTime(effectiveDuration)}
              </span>
              <span className="text-gray-400">
                Original: {formatTime(audio.duration)}
              </span>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Head Trim (seconds)</label>
              <div className="flex space-x-2">
                <input
                  type="range"
                  min="0"
                  max={audio.duration - (tailTrim || 0) - 0.1}
                  step="0.01"
                  value={headTrim}
                  onChange={(e) => setHeadTrimValue(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max={audio.duration - (tailTrim || 0) - 0.1}
                  step="0.01"
                  value={headTrim}
                  onChange={(e) => setHeadTrimValue(parseFloat(e.target.value))}
                  className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1"
                />
                <button
                  onClick={setHeadTrimToCurrentTime}
                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  title="Set head trim to current position"
                >
                  <ChevronsRight size={16} className="mr-1" />
                  SET
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tail Trim (seconds)</label>
              <div className="flex space-x-2">
                <input
                  type="range"
                  min="0"
                  max={audio.duration - (headTrim || 0) - 0.1}
                  step="0.01"
                  value={tailTrim}
                  onChange={(e) => setTailTrimValue(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <input
                  type="number"
                  min="0"
                  max={audio.duration - (headTrim || 0) - 0.1}
                  step="0.01"
                  value={tailTrim}
                  onChange={(e) => setTailTrimValue(parseFloat(e.target.value))}
                  className="w-20 bg-gray-700 border border-gray-600 rounded px-2 py-1"
                />
                <button
                  onClick={setTailTrimToCurrentTime}
                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                  title="Set tail trim to current position"
                >
                  <ChevronsLeft size={16} className="mr-1" />
                  SET
                </button>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handlePlay}
              >
                {isPlaying ? 'Pause' : 'Play Preview'}
              </button>
              
              <div>
                <button
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 mr-2"
                  onClick={onClose}
                >
                  Cancel
                </button>
                
                <button
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  onClick={handleSave}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <audio ref={audioRef} className="hidden" />
      </div>
    </div>
  )
}
