import React from 'react'

interface TabsProps {
  defaultValue: string
  className?: string
  children: React.ReactNode
}

interface TabsListProps {
  className?: string
  children: React.ReactNode
}

interface TabsTriggerProps {
  value: string
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

interface TabsContentProps {
  value: string
  className?: string
  children: React.ReactNode
}

const TabsContext = React.createContext<{
  value: string
  onChange: (value: string) => void
} | null>(null)

export function Tabs({ defaultValue, className, children }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue)
  
  return (
    <TabsContext.Provider value={{ value, onChange: setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ className, children }: TabsListProps) {
  return (
    <div className={`flex ${className}`}>
      {children}
    </div>
  )
}

export function TabsTrigger({ value, disabled, className, children }: TabsTriggerProps) {
  const context = React.useContext(TabsContext)
  
  if (!context) {
    throw new Error('TabsTrigger must be used within a Tabs component')
  }
  
  const isActive = context.value === value
  
  return (
    <button
      disabled={disabled}
      className={`px-4 py-2 border-b-2 ${
        isActive 
          ? 'border-blue-500 text-blue-500' 
          : 'border-transparent text-gray-400 hover:text-gray-300'
      } ${className}`}
      onClick={() => context.onChange(value)}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, className, children }: TabsContentProps) {
  const context = React.useContext(TabsContext)
  
  if (!context) {
    throw new Error('TabsContent must be used within a Tabs component')
  }
  
  return context.value === value ? (
    <div className={className}>{children}</div>
  ) : null
}
