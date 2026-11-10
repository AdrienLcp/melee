type LandingSequence = {
  /** Set on the root element while the faces load, and removed once they have. */
  attribute: string
  /** The app's entry module, started once the page has arrived. */
  entry: string
  /** Each preloaded face, as `document.fonts.load` names it. */
  faces: readonly string[]
  /** How long a page waits for its faces before arriving in the fallbacks. */
  longestFontWaitMs: number
  /** How long the app waits for the arrival before starting regardless. */
  longestArrivalWaitMs: number
  /**
   * What a keyframe may hold and still run on the compositor, which the
   * entry's evaluation does not stop, so the app need not wait for it.
   */
  offMainThread: readonly string[]
}

/**
 * The served page arrives, then the app starts — never both at once.
 *
 * A condensed Bricolage has no fallback the width of it: a page arriving in
 * Arial re-lays itself when the face lands, the wordmark changing shape and a
 * button's label dropping from two lines to one. So the arrival is held under
 * the board until the faces are in, or until `longestFontWaitMs`.
 *
 * Then the app's entry waits for every arrival drawn on the main thread to
 * end. Evaluating it takes a phone's main thread for a third of a second, and
 * `page-lay` is a mask, drawn there: started together, the page sat invisible
 * and was found three quarters laid. A piece shelved by opacity and translate
 * runs on the compositor and goes on regardless. The entry is preloaded
 * meanwhile, so waiting costs its evaluation, not its download.
 */
const playLanding = ({
  attribute,
  entry,
  faces,
  longestArrivalWaitMs,
  longestFontWaitMs,
  offMainThread
}: LandingSequence): void => {
  const root = document.documentElement
  let isAppStarted = false

  const startApp = (): void => {
    if (isAppStarted) {
      return
    }

    isAppStarted = true

    const script = document.createElement('script')

    script.type = 'module'
    script.crossOrigin = ''
    script.src = entry
    document.head.append(script)
  }

  const whenArrived = (): void => {
    setTimeout(startApp, longestArrivalWaitMs)
    requestAnimationFrame(() => {
      const arrivals = document
        .getAnimations()
        .filter(
          (animation) =>
            animation.effect instanceof KeyframeEffect &&
            animation.effect.getComputedTiming().endTime !== Infinity &&
            animation.effect
              .getKeyframes()
              .some((frame) =>
                Object.keys(frame).some(
                  (property) => !offMainThread.includes(property)
                )
              )
        )

      void Promise.allSettled(
        arrivals.map((animation) => animation.finished)
      ).then(startApp)
    })
  }

  const fontsLoaded = new Promise<void>((resolve) => {
    if (document.fonts == null) {
      resolve()
      return
    }

    root.setAttribute(attribute, '')
    setTimeout(resolve, longestFontWaitMs)
    void Promise.allSettled(
      faces.map((face) => document.fonts.load(face))
    ).then(() => resolve())
  }).then(() => {
    root.removeAttribute(attribute)
  })

  const documentParsed = new Promise<void>((resolve) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => resolve())
    } else {
      resolve()
    }
  })

  void Promise.all([fontsLoaded, documentParsed]).then(whenArrived)
}

/**
 * Run inline in the head of every prerendered document, in place of the
 * entry's own module script, which the build removes. Only a prerendered page
 * has its faces preloaded and its arrival written in the document, so the SPA
 * shell a QR code lands on starts the app at once. Written from the function's
 * own source, which is why it closes over nothing and is handed its settings.
 */
export const landingSequenceScript = (entry: string): string => {
  const sequence: LandingSequence = {
    attribute: 'data-fonts-pending',
    entry,
    faces: ['1em "Bricolage Grotesque"', '1em "Atkinson Hyperlegible Next"'],
    longestArrivalWaitMs: 3000,
    longestFontWaitMs: 1200,
    offMainThread: [
      'composite',
      'computedOffset',
      'easing',
      'offset',
      'opacity',
      'rotate',
      'scale',
      'transform',
      'translate'
    ]
  }

  return `(${playLanding.toString()})(${JSON.stringify(sequence)})`
}
