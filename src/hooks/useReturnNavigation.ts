import { useLocation } from "react-router-dom"
import {
  resolveReturnPath,
  returnLabelForPath,
} from "@/lib/returnNavigation"

export function useReturnNavigation(fallbackPath: string): {
  returnPath: string
  returnLabel: string
} {
  const { state } = useLocation()
  const returnPath = resolveReturnPath(state, fallbackPath)
  const returnLabel = returnLabelForPath(returnPath)
  return { returnPath, returnLabel }
}
