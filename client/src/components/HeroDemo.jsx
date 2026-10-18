import { useState, useEffect } from 'react'
import '../styles/landing.css'

let demoPrompt = 'A landing page for a neighbourhood bakery with an order form'

// A small sample build on the landing page: the prompt types itself,
// then the bakery page appears one block at a time, then a phone preview slides in.
function HeroDemo() {
  const [typedText, setTypedText] = useState('')
  const [step, setStep] = useState(0)
  const [runCount, setRunCount] = useState(0)

  useEffect(() => {
    // people who turned off animations just get the finished page
    let skipMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (skipMotion) {
      setTypedText(demoPrompt)
      setStep(5)
      return
    }

    setTypedText('')
    setStep(0)

    let letters = 0
    let stepTimers = []

    let typingTimer = setInterval(() => {
      letters = letters + 1
      setTypedText(demoPrompt.slice(0, letters))

      if (letters === demoPrompt.length) {
        clearInterval(typingTimer)

        for (let number = 1; number <= 5; number++) {
          let timer = setTimeout(() => {
            setStep(number)
          }, 500 + number * 650)
          stepTimers.push(timer)
        }
      }
    }, 34)

    // stop the timers if the component goes away or we replay
    return () => {
      clearInterval(typingTimer)
      stepTimers.forEach((timer) => clearTimeout(timer))
    }
  }, [runCount])

  let handleReplay = () => {
    setRunCount(runCount + 1)
  }

  // a block stays hidden until its step arrives, and glows while it is the newest one
  let blockClass = (name, number) => {
    let classes = 'demo-block ' + name
    if (step >= number) classes = classes + ' shown'
    if (step === number) classes = classes + ' is-new'
    return classes
  }

  let typingDone = typedText === demoPrompt
  let statusText = 'Describing'
  if (typingDone) statusText = 'Building your page'
  if (step === 5) statusText = 'Ready to edit'

  return (
    <div className="demo">
      <div className="demo-window" aria-hidden="true">
        <div className="demo-bar">
          <p className="demo-prompt-text">
            {typedText}
            {!typingDone && <span className="demo-caret"></span>}
          </p>
          <span className={typingDone ? 'demo-send is-pressed' : 'demo-send'}>Build</span>
        </div>

        <div className="demo-status">
          <span className={step === 5 ? 'demo-dot is-ready' : 'demo-dot'}></span>
          {statusText}
        </div>

        <div className="demo-page">
          <div className={blockClass('demo-nav', 1)}>
            <strong>Crumb &amp; Co.</strong>
            <span>Menu</span>
            <span>Visit</span>
            <span>Order</span>
          </div>

          <div className={blockClass('demo-hero', 2)}>
            <h3>Warm bread, ready before breakfast.</h3>
            <p>Baked on Gandhi Road since 2014.</p>
            <span className="demo-button">Order for tomorrow</span>
          </div>

          <div className={blockClass('demo-menu', 3)}>
            <div>
              <b>Sourdough</b>
              <span>₹180</span>
            </div>
            <div>
              <b>Cinnamon knot</b>
              <span>₹90</span>
            </div>
            <div>
              <b>Seeded rye</b>
              <span>₹150</span>
            </div>
          </div>

          <div className={blockClass('demo-order', 4)}>
            <span className="demo-field">Your name</span>
            <span className="demo-field">Pickup day</span>
            <span className="demo-button">Place order</span>
          </div>

          <div className={blockClass('demo-footer', 5)}>Open 6am to 2pm, closed Mondays</div>
        </div>
      </div>

      {/* the same page on a phone, it slides in when the build is done */}
      <div className={step === 5 ? 'demo-phone shown' : 'demo-phone'} aria-hidden="true">
        <div className="demo-phone-screen">
          <strong>Crumb &amp; Co.</strong>
          <h4>Warm bread, ready before breakfast.</h4>
          <span className="demo-button">Order</span>
          <span className="demo-phone-tile"></span>
          <span className="demo-phone-tile"></span>
        </div>
      </div>

      <div className="demo-caption">
        <span>A sample build: bakery page</span>
        <button className="demo-replay" onClick={handleReplay}>
          Replay
        </button>
      </div>
    </div>
  )
}

export default HeroDemo
