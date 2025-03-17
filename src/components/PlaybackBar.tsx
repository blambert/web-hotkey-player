import { useAudio } from '../contexts/AudioContext'
import { Play, Pause, Square, SkipBack, SkipForward, Repeat } from 'lucide-react'

export default function PlaybackBar() {
  const { 
    playbackStatus, 
    audioFiles, 
    playlists,
    play, 
    stop, 
    pause, 
    resume, 
    next, 
    previous,
    setLoop,
    getEffectiveDuration
  } = useAudio()
  
  const { 
    isPlaying, 
    currentAudioId, 
    elapsedTime, 
    currentPlaylistId,
    currentPlaylistIndex,
    loop
  } = playbackStatus
  
  const currentAudio = currentAudioId 
    ? audioFiles.find(audio => audio.id === currentAudioId) 
    : null
  
  const currentPlaylist = currentPlaylistId 
    ? playlists.find(playlist => playlist.id === currentPlaylistId) 
    : null
  
  // Calculate total duration for the current item (could be a single audio or a playlist)
  const calculateTotalDuration = () => {
    if (currentPlaylist) {
      return currentPlaylist.items.reduce((total, item) => {
        const audio = audioFiles.find(a => a.id === item.audioId)
        return total + (audio ? getEffectiveDuration(audio) : 0)
      }, 0)
    }
    
    return currentAudio ? getEffectiveDuration(currentAudio) : 0
  }
  
  // Calculate elapsed time for the entire playback (including previous tracks in playlist)
  const calculateTotalElapsedTime = () => {
    if (currentPlaylist && currentPlaylistIndex > 0) {
      const previousItemsDuration = currentPlaylist.items
        .slice(0, currentPlaylistIndex)
        .reduce((total, item) => {
          const audio = audioFiles.find(a => a.id === item.audioId)
          return total + (audio ? getEffectiveDuration(audio) : 0)
        }, 0)
      
      // Adjust elapsed time to account for head trim
      let adjustedElapsedTime = elapsedTime;
      if (currentAudio && currentAudio.trimHead) {
        adjustedElapsedTime = Math.max(0, elapsedTime - currentAudio.trimHead);
      }
      
      return previousItemsDuration + adjustedElapsedTime
    }
    
    // Adjust elapsed time to account for head trim for single track playback
    if (currentAudio && currentAudio.trimHead) {
      return Math.max(0, elapsedTime - currentAudio.trimHead);
    }
    
    return elapsedTime
  }
  
  const totalDuration = calculateTotalDuration()
  const totalElapsedTime = calculateTotalElapsedTime()
  const remainingTime = Math.max(0, totalDuration - totalElapsedTime)
  
  // Format time as MM:SS.ms
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    const ms = Math.floor((time % 1) * 100)
    
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
  }
  
  // Calculate progress percentage
  const progressPercentage = totalDuration > 0 
    ? (totalElapsedTime / totalDuration) * 100 
    : 0
  
  const handlePlayPause = () => {
    if (isPlaying) {
      pause()
    } else if (currentAudioId) {
      resume()
    }
  }
  
  const displayTitle = () => {
    if (!currentAudio) return null
    
    if (currentPlaylist) {
      const currentTrack = currentAudio?.name || 'Unknown'
      return `${currentPlaylist.name}: ${currentTrack} (${currentPlaylistIndex + 1}/${currentPlaylist.items.length})`
    }
    
    return currentAudio?.name
  }
  
  // Only show playback controls if there's something to play
  if (!currentAudio && !isPlaying) {
    return (
      <div className="bg-gray-800 border-b border-gray-700 p-3">
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="flex space-x-3">
              <button 
                onClick={() => setLoop(!loop)}
                className={`p-1.5 rounded-full ${loop ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
              >
                <Repeat size={16} />
              </button>
              
              <button 
                className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                disabled={true}
              >
                <Play size={16} />
              </button>
              
              <button 
                disabled={true}
                className="p-1.5 rounded-full bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed"
              >
                <Square size={16} />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Empty space where times would be */}
            </div>
          </div>
          
          <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
            {/* Empty progress bar */}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-gray-800 border-b border-gray-700 p-3">
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="flex space-x-3">
            <button 
              onClick={() => setLoop(!loop)}
              className={`p-1.5 rounded-full ${loop ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            >
              <Repeat size={16} />
            </button>
            
            <button 
              onClick={previous}
              disabled={!currentPlaylistId || currentPlaylistIndex === 0}
              className={`p-1.5 rounded-full ${
                !currentPlaylistId || currentPlaylistIndex === 0 
                  ? 'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <SkipBack size={16} />
            </button>
            
            <button 
              onClick={handlePlayPause}
              className="p-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            
            <button 
              onClick={stop}
              disabled={!currentAudioId}
              className={`p-1.5 rounded-full ${
                !currentAudioId 
                  ? 'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Square size={16} />
            </button>
            
            <button 
              onClick={next}
              disabled={!currentPlaylistId || currentPlaylistIndex === (currentPlaylist?.items.length || 0) - 1}
              className={`p-1.5 rounded-full ${
                !currentPlaylistId || currentPlaylistIndex === (currentPlaylist?.items.length || 0) - 1 
                  ? 'bg-gray-700 text-gray-400 opacity-50 cursor-not-allowed' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <SkipForward size={16} />
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-400">
              {formatTime(totalElapsedTime)}
            </div>
            
            <div className="text-xl font-bold text-white">
              {displayTitle()}
            </div>
            
            <div className={`text-xl font-mono ${remainingTime < 5 ? 'text-red-500' : 'text-gray-300'}`}>
              {formatTime(remainingTime)}
            </div>
          </div>
        </div>
        
        <div className="relative h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="absolute h-full bg-blue-600"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  )
}
