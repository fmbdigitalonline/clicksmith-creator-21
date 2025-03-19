
import { useEffect, useState } from "react"
import { useCookies } from "react-cookie"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { createContext, useContext } from "react"

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

type SidebarContextType = {
  isCollapsed: boolean;
  toggleSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

interface SidebarProviderProps {
  children: React.ReactNode
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [cookies, setCookie] = useCookies([SIDEBAR_COOKIE_NAME])
  const [isCollapsed, setIsCollapsed] = useState(
    cookies[SIDEBAR_COOKIE_NAME] === "true"
  )

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
    setCookie(SIDEBAR_COOKIE_NAME, !isCollapsed, {
      path: "/",
      maxAge: SIDEBAR_COOKIE_MAX_AGE,
      sameSite: "strict"
    })
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  )
}

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

export function Sidebar({ children, className }: SidebarProps) {
  const { isCollapsed, toggleSidebar } = useSidebar()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Initial check
    checkMobile()
    
    // Add resize listener
    window.addEventListener('resize', checkMobile)
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleSidebar()
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [toggleSidebar])

  return (
    <aside
      className={cn(
        "group/sidebar fixed md:relative h-screen border-r bg-background transition-all duration-300 z-30",
        isCollapsed || isMobile
          ? "w-[3.5rem]" 
          : "w-[16rem]",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute -right-3 top-20 z-40 h-6 w-6 rounded-lg border bg-background p-0 shadow-sm opacity-0 group-hover/sidebar:opacity-100 transition-opacity hidden md:flex",
          isCollapsed && "rotate-180"
        )}
        onClick={toggleSidebar}
      >
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      {children}
    </aside>
  )
}

export function SidebarContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar()
  return (
    <div className={cn(
      "h-full flex flex-col",
      isCollapsed ? "px-1" : "px-2"
    )}>
      {children}
    </div>
  )
}

export function SidebarGroup({ children }: { children: React.ReactNode }) {
  return <div className="px-1">{children}</div>
}

interface SidebarGroupLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarGroupLabel({ children, className }: SidebarGroupLabelProps) {
  const { isCollapsed } = useSidebar()
  return (
    <div className={cn(
      "mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground truncate",
      isCollapsed && "sr-only",
      className
    )}>
      {children}
    </div>
  )
}

export function SidebarGroupContent({ children }: { children: React.ReactNode }) {
  return <div className="space-y-1">{children}</div>
}

export function SidebarMenu({ children }: { children: React.ReactNode }) {
  return <nav>{children}</nav>
}

interface SidebarMenuItemProps {
  children: React.ReactNode
  className?: string
}

export function SidebarMenuItem({ children, className }: SidebarMenuItemProps) {
  return <div className={cn("px-1", className)}>{children}</div>
}

interface SidebarMenuButtonProps extends React.ComponentPropsWithoutRef<typeof Button> {
  isActive?: boolean
  tooltip?: string
  asChild?: boolean
}

export function SidebarMenuButton({
  children,
  className,
  isActive,
  tooltip,
  ...props
}: SidebarMenuButtonProps) {
  const { isCollapsed } = useSidebar()

  return (
    <Button
      variant={isActive ? "secondary" : "ghost"}
      className={cn(
        "w-full justify-start",
        isCollapsed ? "px-2" : "px-3",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}
