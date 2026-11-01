import { useEffect, useRef } from 'react'
import { AUTO, Game } from 'phaser'

function App() {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const game = new Game({
      type: AUTO,
      parent: container.current!,
      width: 800,
      height: 600,
      backgroundColor: '#0b2232',
    })
    return () => game.destroy(true)
  }, [])

  return <div ref={container} />
}

export default App
