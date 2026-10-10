import { createContext, useContext, useEffect, useRef } from 'react'

/** The session owns one persistent keyboard; exercises borrow it (no keyboard flicker between steps). */
export interface KbApi {
  bind: (fn: (k: string, el: HTMLElement | null) => void) => void
  unbind: (fn: (k: string, el: HTMLElement | null) => void) => void
  setWrong: (k: string) => void
  setDisabled: (d: boolean) => void
}

export const KbContext = createContext<KbApi | null>(null)

export function useSessionKeyboard(onKey: (k: string, el: HTMLElement | null) => void, disabled: boolean) {
  const api = useContext(KbContext)
  const ref = useRef(onKey)
  ref.current = onKey
  useEffect(() => {
    if (!api) return
    const fn = (k: string, el: HTMLElement | null) => ref.current(k, el)
    api.bind(fn)
    return () => api.unbind(fn)
  }, [api])
  useEffect(() => {
    api?.setDisabled(disabled)
  }, [api, disabled])
  return api
}
