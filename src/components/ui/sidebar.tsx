import { useEffect, useState } from "react"
import { useCookies } from "react-cookie"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { createContext, useContext } from "react"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "12rem"
const SIDEBAR_WIDTH_MOBILE = "14rem"
const SIDEBAR_WIDTH_ICON = "3rem"
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
        "group/sidebar relative h-screen border-r bg-background pt-16 will-change-transform",
        isCollapsed ? "w-[3rem]" : "w-[12rem] md:w-[12rem]",
        className
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute -right-3 top-20 z-20 h-6 w-6 rounded-lg border bg-background p-0 shadow-sm opacity-0 group-hover/sidebar:opacity-100 transition-opacity",
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
  return <div className="space-y-4">{children}</div>
}

export function SidebarGroup({ children }: { children: React.ReactNode }) {
  return <div className="px-3">{children}</div>
}

export function SidebarGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 px-2 text-xs font-semibold uppercase text-muted-foreground">
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
  return <div className={cn("px-2", className)}>{children}</div>
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
        isCollapsed && "px-2",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  )
}