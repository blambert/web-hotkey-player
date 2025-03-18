import { AudioFile, Playlist, HotKey, AssignedItem } from '../types';

// Helper to get filename without extension
export function getFilenameWithoutExtension(filename: string): string {
  return filename.replace(/\.[^/.]+$/, "");
}

// Structure for exported settings
export interface ExportedSettings {
  audioFiles: {
    name: string;
    trimHead?: number;
    trimTail?: number;
    volume: number;
  }[];
  playlists: {
    id: string;
    name: string;
    items: {
      audioFilename: string;
    }[];
    playbackMode: string;
  }[];
  hotkeys: {
    bank: number;
    keynumber: number;
    type: 'audio' | 'playlist';
    filename?: string;
    playlistId?: string;
  }[];
}

// Export settings
export function exportSettings(
  audioFiles: AudioFile[],
  playlists: Playlist[],
  hotkeys: HotKey[]
): ExportedSettings {
  // Export audio files (name without extension, trim values, volume)
  const exportedAudioFiles = audioFiles.map(audio => ({
    name: getFilenameWithoutExtension(audio.name),
    trimHead: audio.trimHead,
    trimTail: audio.trimTail,
    volume: audio.volume
  }));

  // Export playlists with audio references by filename
  const exportedPlaylists = playlists.map(playlist => ({
    id: playlist.id,
    name: playlist.name,
    items: playlist.items.map(item => {
      const audioFile = audioFiles.find(a => a.id === item.audioId);
      return {
        audioFilename: audioFile ? getFilenameWithoutExtension(audioFile.name) : ''
      };
    }).filter(item => item.audioFilename !== ''),
    playbackMode: playlist.playbackMode
  }));

  // Export hotkeys with audio references by filename
  const exportedHotkeys = hotkeys
    .filter(hotkey => hotkey.assignedItem !== null)
    .map(hotkey => {
      const result: any = {
        bank: hotkey.bankId,
        keynumber: hotkey.position,
        type: hotkey.assignedItem?.type
      };

      if (hotkey.assignedItem?.type === 'audio') {
        const audioFile = audioFiles.find(a => a.id === hotkey.assignedItem?.id);
        if (audioFile) {
          result.filename = getFilenameWithoutExtension(audioFile.name);
        }
      } else if (hotkey.assignedItem?.type === 'playlist') {
        const playlist = playlists.find(p => p.id === hotkey.assignedItem?.id);
        if (playlist) {
          result.playlistId = playlist.id;
        }
      }

      return result;
    });

  return {
    audioFiles: exportedAudioFiles,
    playlists: exportedPlaylists,
    hotkeys: exportedHotkeys
  };
}

// Import settings
export function importSettings(
  settings: ExportedSettings,
  currentAudioFiles: AudioFile[],
  currentPlaylists: Playlist[],
  updateAudioFile: (id: string, updates: Partial<AudioFile>) => void,
  createPlaylist: (name: string) => Playlist,
  updatePlaylist: (id: string, updates: Partial<Playlist>) => void,
  addToPlaylist: (playlistId: string, audioId: string) => void,
  assignToHotkey: (bankId: number, position: number, item: AssignedItem) => void
): string[] {
  const missingFiles: string[] = [];

  // Map for quick lookup of audio files by name
  const audioFilesByName = new Map<string, AudioFile>();
  currentAudioFiles.forEach(audio => {
    audioFilesByName.set(getFilenameWithoutExtension(audio.name), audio);
  });

  // Apply audio file updates (trim values, volume)
  settings.audioFiles.forEach(importedAudio => {
    const matchingAudio = audioFilesByName.get(importedAudio.name);
    if (matchingAudio) {
      // Apply updates from imported settings
      updateAudioFile(matchingAudio.id, {
        trimHead: importedAudio.trimHead,
        trimTail: importedAudio.trimTail,
        volume: importedAudio.volume
      });
    } else {
      missingFiles.push(importedAudio.name);
    }
  });

  // Process playlists
  const playlistMap = new Map<string, string>(); // Map imported playlist IDs to new IDs
  settings.playlists.forEach(importedPlaylist => {
    // Create a new playlist or update existing one with matching name
    const existingPlaylist = currentPlaylists.find(p => p.name === importedPlaylist.name);
    
    if (existingPlaylist) {
      // Update existing playlist
      updatePlaylist(existingPlaylist.id, {
        playbackMode: importedPlaylist.playbackMode as any
      });
      playlistMap.set(importedPlaylist.id, existingPlaylist.id);
    } else {
      // Create new playlist
      const newPlaylist = createPlaylist(importedPlaylist.name);
      playlistMap.set(importedPlaylist.id, newPlaylist.id);
    }
    
    // Add items to playlist
    const targetPlaylistId = playlistMap.get(importedPlaylist.id) || '';
    importedPlaylist.items.forEach(item => {
      const matchingAudio = audioFilesByName.get(item.audioFilename);
      if (matchingAudio) {
        addToPlaylist(targetPlaylistId, matchingAudio.id);
      } else if (!missingFiles.includes(item.audioFilename)) {
        missingFiles.push(item.audioFilename);
      }
    });
  });

  // Process hotkeys
  settings.hotkeys.forEach(importedHotkey => {
    if (importedHotkey.type === 'audio' && importedHotkey.filename) {
      const matchingAudio = audioFilesByName.get(importedHotkey.filename);
      if (matchingAudio) {
        assignToHotkey(importedHotkey.bank, importedHotkey.keynumber, {
          type: 'audio',
          id: matchingAudio.id
        });
      } else if (!missingFiles.includes(importedHotkey.filename)) {
        missingFiles.push(importedHotkey.filename);
      }
    } else if (importedHotkey.type === 'playlist' && importedHotkey.playlistId) {
      const newPlaylistId = playlistMap.get(importedHotkey.playlistId);
      if (newPlaylistId) {
        assignToHotkey(importedHotkey.bank, importedHotkey.keynumber, {
          type: 'playlist',
          id: newPlaylistId
        });
      }
    }
  });

  return missingFiles;
}
