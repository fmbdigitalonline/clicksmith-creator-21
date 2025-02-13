
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState<boolean>(false)

  React.useEffect(() => {
    const media = window.matchMedia(query)
    const updateMatch = () => {
      setMatches(media.matches)
    }
    
    // Set initial value
    updateMatch()
    
    // Setup listeners
    media.addEventListener("change", updateMatch)
    
    // Cleanup
    return () => {
      media.removeEventListener("change", updateMatch)
    }
  }, [query])

  return matches
}
