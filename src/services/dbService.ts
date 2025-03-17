import { openDB, IDBPDatabase } from 'idb';
import { AudioFile, HotKey, Playlist, PlaybackStatus } from '../types';

// Define database name and version
const DB_NAME = 'audioPlayerDB';
const DB_VERSION = 1;

// Define store names
const STORES = {
  AUDIO_FILES: 'audioFiles',
  HOTKEYS: 'hotkeys',
  PLAYLISTS: 'playlists',
  APP_STATE: 'appState'
};

// AudioFile with blob data for storage
interface AudioFileWithData extends Omit<AudioFile, 'src'> {
  fileData: ArrayBuffer;
  fileType: string;
}

// Interface for app state in storage
interface AppState {
  currentBank: number;
  playbackStatus: PlaybackStatus;
}

// Service for database operations
class DBService {
  private db: IDBPDatabase | null = null;

  // Initialize the database
  async initDB(): Promise<IDBPDatabase> {
    if (this.db) return this.db;

    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.AUDIO_FILES)) {
          db.createObjectStore(STORES.AUDIO_FILES, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.HOTKEYS)) {
          db.createObjectStore(STORES.HOTKEYS, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.PLAYLISTS)) {
          db.createObjectStore(STORES.PLAYLISTS, { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains(STORES.APP_STATE)) {
          db.createObjectStore(STORES.APP_STATE, { keyPath: 'id' });
        }
      }
    });

    return this.db;
  }

  // Audio Files Methods
  
  // Save audio file with actual file data
  async saveAudioFile(audioFile: AudioFile, fileData: ArrayBuffer): Promise<void> {
    const db = await this.initDB();
    
    const audioFileWithData: AudioFileWithData = {
      ...audioFile,
      fileData,
      fileType: audioFile.type,
    };
    
    // Remove the src property as it's a URL object that can't be stored
    const { src, ...audioFileForStorage } = audioFileWithData as any;
    
    await db.put(STORES.AUDIO_FILES, audioFileForStorage);
  }

  // Get all audio files
  async getAllAudioFiles(): Promise<AudioFile[]> {
    const db = await this.initDB();
    const audioFilesWithData: AudioFileWithData[] = await db.getAll(STORES.AUDIO_FILES);
    
    // Convert stored files back to AudioFile objects with object URLs
    return audioFilesWithData.map(fileWithData => {
      const { fileData, fileType, ...audioFileData } = fileWithData;
      
      // Create a blob from the stored data
      const blob = new Blob([fileData], { type: fileType });
      
      // Create an object URL for the blob
      const src = URL.createObjectURL(blob);
      
      return {
        ...audioFileData,
        src,
        type: fileType
      } as AudioFile;
    });
  }

  // Delete audio file
  async deleteAudioFile(id: string): Promise<void> {
    const db = await this.initDB();
    await db.delete(STORES.AUDIO_FILES, id);
  }

  // Update audio file (without changing the file data)
  async updateAudioFile(id: string, updates: Partial<AudioFile>): Promise<void> {
    const db = await this.initDB();
    
    // Get the current stored file
    const storedFile = await db.get(STORES.AUDIO_FILES, id);
    if (!storedFile) return;
    
    // Apply updates without changing file data or creating new src
    const { src, ...updatesWithoutSrc } = updates as any;
    
    await db.put(STORES.AUDIO_FILES, {
      ...storedFile,
      ...updatesWithoutSrc
    });
  }

  // Hotkeys Methods
  
  // Save all hotkeys
  async saveHotkeys(hotkeys: HotKey[]): Promise<void> {
    const db = await this.initDB();
    
    // Delete all existing hotkeys
    const tx = db.transaction(STORES.HOTKEYS, 'readwrite');
    await tx.objectStore(STORES.HOTKEYS).clear();
    
    // Add all hotkeys
    for (const hotkey of hotkeys) {
      await tx.objectStore(STORES.HOTKEYS).add(hotkey);
    }
    
    await tx.done;
  }

  // Get all hotkeys
  async getAllHotkeys(): Promise<HotKey[]> {
    const db = await this.initDB();
    return db.getAll(STORES.HOTKEYS);
  }

  // Playlists Methods
  
  // Save all playlists
  async savePlaylists(playlists: Playlist[]): Promise<void> {
    const db = await this.initDB();
    
    // Delete all existing playlists
    const tx = db.transaction(STORES.PLAYLISTS, 'readwrite');
    await tx.objectStore(STORES.PLAYLISTS).clear();
    
    // Add all playlists
    for (const playlist of playlists) {
      await tx.objectStore(STORES.PLAYLISTS).add(playlist);
    }
    
    await tx.done;
  }

  // Get all playlists
  async getAllPlaylists(): Promise<Playlist[]> {
    const db = await this.initDB();
    return db.getAll(STORES.PLAYLISTS);
  }

  // App State Methods
  
  // Save app state
  async saveAppState(currentBank: number, playbackStatus: PlaybackStatus): Promise<void> {
    const db = await this.initDB();
    
    // Create a cleaned copy of playback status without circular references
    const cleanPlaybackStatus = {
      ...playbackStatus,
      // Reset some values that don't need to be persisted
      isPlaying: false,
      elapsedTime: 0
    };
    
    await db.put(STORES.APP_STATE, {
      id: 'appState',
      currentBank,
      playbackStatus: cleanPlaybackStatus
    });
  }

  // Get app state
  async getAppState(): Promise<AppState | undefined> {
    const db = await this.initDB();
    return db.get(STORES.APP_STATE, 'appState');
  }
}

export const dbService = new DBService();
