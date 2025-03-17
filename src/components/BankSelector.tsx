import { useAudio } from '../contexts/AudioContext'

interface BankSelectorProps {
  banks: number
  currentBank: number
  setCurrentBank: (bank: number) => void
}

export default function BankSelector({ 
  banks, 
  currentBank, 
  setCurrentBank 
}: BankSelectorProps) {
  const { playlists } = useAudio()
  
  // Check if a bank has a playlist
  const bankHasPlaylist = (bankId: number) => {
    return playlists.some(playlist => 
      playlist.name.toLowerCase().includes(`bank ${bankId}`)
    )
  }
  
  return (
    <div className="flex justify-between items-center mb-4">
      {/* Current Bank Display on Left */}
      <div className="text-xl font-bold">
        Bank {currentBank}
      </div>
      
      {/* Bank Selection Buttons on Right */}
      <div className="flex gap-2">
        {Array.from({ length: banks }).map((_, index) => {
          const bankId = index + 1
          const hasPlaylist = bankHasPlaylist(bankId)
          
          return (
            <button
              key={bankId}
              className={`
                px-4 py-2 rounded-lg relative
                ${currentBank === bankId 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
              `}
              onClick={() => setCurrentBank(bankId)}
            >
              {bankId}
              {hasPlaylist && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
