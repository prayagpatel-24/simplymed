// A short burst of confetti when a care plan is ready. Pure decoration: hidden from screen
// readers, ignores clicks, and skipped for people who ask their device for less motion.

const COLORS = ['#3f8f5f', '#c9a45c', '#d9734a', '#3d7fb5', '#7a5bb0', '#c0506a', '#2f8a83']

export function celebrate({ pieces = 160, duration = 2600 } = {}) {
  if (typeof window === 'undefined') return
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

  const canvas = document.createElement('canvas')
  canvas.className = 'confetti'
  canvas.setAttribute('aria-hidden', 'true')
  document.body.appendChild(canvas)
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    canvas.remove()
    return
  }

  const ratio = window.devicePixelRatio || 1
  const resize = () => {
    canvas.width = window.innerWidth * ratio
    canvas.height = window.innerHeight * ratio
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
  resize()
  window.addEventListener('resize', resize)

  const w = window.innerWidth
  const h = window.innerHeight
  // Two cannons in the bottom corners, aimed up and inward.
  const confetti = Array.from({ length: pieces }, (_, i) => {
    const left = i % 2 === 0
    const angle = (left ? -60 : -120) * (Math.PI / 180) + (Math.random() - 0.5) * 0.7
    const speed = h * (0.022 + Math.random() * 0.014)
    return {
      x: left ? 0 : w,
      y: h,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 6 + Math.random() * 6,
      color: COLORS[i % COLORS.length],
      spin: Math.random() * Math.PI,
      spinSpeed: (Math.random() - 0.5) * 0.3,
    }
  })

  const start = performance.now()
  function frame(now) {
    const elapsed = now - start
    ctx.clearRect(0, 0, w, h)
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - duration * 0.6) / (duration * 0.4))
    for (const p of confetti) {
      p.vy += 0.35
      p.vx *= 0.99
      p.x += p.vx
      p.y += p.vy
      p.spin += p.spinSpeed
      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.spin)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2)
      ctx.restore()
    }
    if (elapsed < duration) {
      requestAnimationFrame(frame)
    } else {
      window.removeEventListener('resize', resize)
      canvas.remove()
    }
  }
  requestAnimationFrame(frame)
}
