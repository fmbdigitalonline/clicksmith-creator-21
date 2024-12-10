import { useEffect, useState } from "react"
import { useCookies } from "react-cookie"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

const SIDEBAR_COOKIE_NAME = "sidebar:state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "12rem"
const SIDEBAR_WIDTH_MOBILE = "14rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

interface SidebarProps {
  children: React.ReactNode
  className?: string
}

export function Sidebar({ children, className }: SidebarProps) {
  const [cookies, setCookie] = useCookies([SIDEBAR_COOKIE_NAME])
  const [isCollapsed, setIsCollapsed] = useState(
    cookies[SIDEBAR_COOKIE_NAME] === "true"
  )

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setIsCollapsed((collapsed) => !collapsed)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed)
    setCookie(SIDEBAR_COOKIE_NAME, !isCollapsed, {
      path: "/",
      maxAge: SIDEBAR_COOKIE_MAX_AGE,
    })
  }

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