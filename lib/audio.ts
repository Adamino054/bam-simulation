/**
 * Utilitaire de synthèse sonore Web Audio pour CBS Simulator.
 * Génère des effets sonores premium en temps réel de manière autonome (sans chargement de fichiers).
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      // @ts-ignore
      const AudioCtx = window.AudioContext || window.webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    return this.ctx
  }

  /** Démarre le contexte si l'état est suspendu (sécurité navigateur) */
  private async resumeContext(ctx: AudioContext): Promise<boolean> {
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
        return true
      } catch (e) {
        return false
      }
    }
    return true
  }

  /**
   * Clic mécanique subtil (Terminal Bloomberg)
   */
  async playTick() {
    const ctx = this.getContext()
    if (!ctx) return
    await this.resumeContext(ctx)

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = 'triangle'
    // Fréquence très courte décroissante
    osc.frequency.setValueAtTime(1400, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.03)

    // Filtre passe-haut pour le côté mécanique
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(300, ctx.currentTime)

    // Enveloppe d'amplitude très raide (0.03s)
    gain.gain.setValueAtTime(0.04, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.04)
  }

  /**
   * Alerte sonore discrète lors d'une crise ou d'un choc macroéconomique
   */
  async playAlert() {
    const ctx = this.getContext()
    if (!ctx) return
    await this.resumeContext(ctx)

    const now = ctx.currentTime
    const duration = 0.6

    // Dual oscillator pour un accord métallique
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(260, now) // Note grave
    
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(285, now) // Légère dissonance d'alerte

    // Enveloppe d'alerte : attaque rapide (0.05s) puis décroissance lente (0.5s)
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.12, now + 0.06)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start()
    osc2.start()
    osc1.stop(now + duration)
    osc2.stop(now + duration)
  }

  /**
   * Signal sonore de réussite (Arpège ascendant)
   */
  async playSuccess() {
    const ctx = this.getContext()
    if (!ctx) return
    await this.resumeContext(ctx)

    const now = ctx.currentTime
    
    // Notes de l'arpège (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50]
    const noteDuration = 0.12

    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + index * 0.08)

      gain.gain.setValueAtTime(0, now + index * 0.08)
      gain.gain.linearRampToValueAtTime(0.06, now + index * 0.08 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + noteDuration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now + index * 0.08)
      osc.stop(now + index * 0.08 + noteDuration)
    })
  }

  /**
   * Signal sonore d'échec / pénalité (Baisse de fréquence)
   */
  async playFailure() {
    const ctx = this.getContext()
    if (!ctx) return
    await this.resumeContext(ctx)

    const now = ctx.currentTime
    const duration = 0.4

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(180, now)
    osc.frequency.linearRampToValueAtTime(90, now + duration)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(300, now)

    gain.gain.setValueAtTime(0.08, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(now + duration)
  }

  /**
   * Ambiance originale de lancement pour le jeu du million.
   * Inspiree des codes TV quiz sans reprendre un jingle existant.
   */
  async playMillionIntro() {
    const ctx = this.getContext()
    if (!ctx) return
    await this.resumeContext(ctx)

    const now = ctx.currentTime
    const notes = [130.81, 196, 261.63, 392, 523.25]
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = index % 2 === 0 ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq, now + index * 0.16)
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(1100, now)
      gain.gain.setValueAtTime(0, now + index * 0.16)
      gain.gain.linearRampToValueAtTime(0.055, now + index * 0.16 + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.16 + 0.48)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + index * 0.16)
      osc.stop(now + index * 0.16 + 0.55)
    })
  }

  /** Suspense court au moment ou une nouvelle question arrive. */
  async playQuestionReveal() {
    const ctx = this.getContext()
    if (!ctx) return
    await this.resumeContext(ctx)

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(110, now)
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.55)
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(480, now)
    filter.frequency.linearRampToValueAtTime(1500, now + 0.55)
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.045, now + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.72)
  }

  /** Petit son de spot pour chaque choix qui apparait. */
  async playOptionReveal(step = 0) {
    const ctx = this.getContext()
    if (!ctx) return
    await this.resumeContext(ctx)

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(520 + step * 80, now)
    osc.frequency.exponentialRampToValueAtTime(780 + step * 90, now + 0.08)
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.linearRampToValueAtTime(0.045, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.14)
  }

  /** Validation plus solennelle pour une bonne reponse du jeu du million. */
  async playMillionCorrect() {
    const ctx = this.getContext()
    if (!ctx) return
    await this.resumeContext(ctx)

    const now = ctx.currentTime
    const notes = [392, 493.88, 587.33, 783.99]
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + index * 0.09)
      gain.gain.setValueAtTime(0.001, now + index * 0.09)
      gain.gain.linearRampToValueAtTime(0.07, now + index * 0.09 + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.09 + 0.28)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + index * 0.09)
      osc.stop(now + index * 0.09 + 0.32)
    })
  }

  /** Fanfare originale de victoire finale. */
  async playMillionWin() {
    const ctx = this.getContext()
    if (!ctx) return
    await this.resumeContext(ctx)

    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = index >= 3 ? 'triangle' : 'sine'
      osc.frequency.setValueAtTime(freq, now + index * 0.11)
      gain.gain.setValueAtTime(0.001, now + index * 0.11)
      gain.gain.linearRampToValueAtTime(0.075, now + index * 0.11 + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.11 + 0.45)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + index * 0.11)
      osc.stop(now + index * 0.11 + 0.5)
    })
  }
}

export const sound = new SoundSynthesizer()
