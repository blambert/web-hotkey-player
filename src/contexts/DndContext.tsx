import React, { createContext, useContext, useState } from 'react'
import { DragItem } from '../types'

interface DndContextType {
  draggedItem: DragItem | null
  setDraggedItem: (item: DragItem | null) => void
}

const DndContext = createContext<DndContextType | null>(null)

export function useDnd() {
  const context = useContext(DndContext)
  if (!context) {
    throw new Error('useDnd must be used within a DndProvider')
  }
  return context
}

export function DndProvider({ children }: { children: React.ReactNode }) {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null)
  
  const value: DndContextType = {
    draggedItem,
    setDraggedItem
  }
  
  return (
    <DndContext.Provider value={value}>
      {children}
    </DndContext.Provider>
  )
}
