import { useState, useRef, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import api from '../api/api.js'
import Logo from '../components/Logo.jsx'
import HeroDemo from '../components/HeroDemo.jsx'
import StepArt from '../components/StepArt.jsx'
import '../styles/landing.css'

let starterChips = [
  {
    label: 'Bakery page',
    text: 'A landing page for a neighbourhood bakery with a menu and a pickup order form',
  },
  {
    label: 'Budget tracker',
    text: 'A simple monthly budget tracker where I add expenses and see a total by category',
  },
  {
    label: 'Wedding invite',
    text: 'A wedding invitation page with the schedule, venue details and an RSVP form',
  },
]

let points = [
  'Live preview on desktop, tablet and phone',
  'Change anything just by chatting',
  'Download one HTML file when you are done',
]

let steps = [
  {
    title: 'Describe it',
    text: 'Type what you want in your own words. One sentence is enough to start.',
    art: 'describe',
  },
  {
    title: 'Watch it get built',
    text: 'Gemini writes the HTML, CSS and JavaScript and shows the live page next to the chat.',
    art: 'build',
  },
  {
    title: 'Keep changing it',
    text: 'Ask for a bigger heading, a darker theme or a contact form. Each reply updates the same page.',
    art: 'chat',
  },
  {
    title: 'Take it with you',
    text: 'Edit the code by hand, or download a single HTML file that opens anywhere.',
    art: 'download',
  },
]

let ideas = [
  'A portfolio for a wedding photographer',
  'A quiz game about South Indian cinema',
  'A menu page for a small chai stall',
  'A study planner with a countdown to exams',
  'A booking page for a yoga studio',
]

function Landing() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  const promptRef = useRef(null)

  let handlePromptChange = (event) => {
    setPrompt(event.target.value)
    setError('')
  }

  let handleStart = async () => {
    let cleanPrompt = prompt.trim()

    if (cleanPrompt === '') {
      setError('Write a sentence about the page you want first.')
      promptRef.current.focus()
      return
    }

    // not logged in yet: remember the prompt, we use it right after login
    if (!user) {
      sessionStorage.setItem('pendingPrompt', cleanPrompt)
      navigate('/login')
      return
    }

    setStarting(true)
    try {
      let response = await api.post('/projects', {})
      navigate(`/builder/${response.data.project._id}`, { state: { prompt: cleanPrompt } })
    } catch (err) {
      console.log(err)
      setError('We could not start your project. Please try again.')
      setStarting(false)
    }
  }

  // Ctrl + Enter (or Cmd + Enter) sends the prompt
  let handlePromptKey = (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      handleStart()
    }
  }

  // puts text in the prompt box and takes the person back up to it
  let fillPrompt = (text) => {
    setPrompt(text)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    promptRef.current.focus()
  }

  return (
    <div className="landing">
      <section className="hero">
        <header className="landing-header">
          <Logo light />
          <nav className="landing-nav">
            <a href="#how-it-works" className="landing-nav-link">
              How it works
            </a>
            <a href="#ideas" className="landing-nav-link">
              Ideas
            </a>
            {user ? (
              <Link to="/dashboard" className="btn btn-outline-light btn-small">
                Your projects
              </Link>
            ) : (
              <Link to="/login" className="btn btn-outline-light btn-small">
                Log in
              </Link>
            )}
          </nav>
        </header>

        <div className="hero-inner">
          <h1 className="hero-title">
            <span className="hero-line">Describe a website.</span>
            <span className="hero-line">Watch it get built.</span>
          </h1>

          <div className="hero-grid">
            <div className="hero-left">
              <p className="hero-subtitle">
                NxtBuild turns one plain sentence into a working page. Preview it live, change it by chatting, edit
                the code yourself, and download it when you are happy.
              </p>

              <div className="prompt-box">
                <label htmlFor="hero-prompt" className="visually-hidden">
                  Describe the page you want
                </label>
                <textarea
                  id="hero-prompt"
                  ref={promptRef}
                  className="prompt-input"
                  rows="3"
                  maxLength="2000"
                  placeholder="A sleek landing page for a specialty coffee shop with a menu, customer reviews, and a visit section"
                  value={prompt}
                  onChange={handlePromptChange}
                  onKeyDown={handlePromptKey}
                />
                <div className="prompt-footer">
                  <span className="prompt-hint">Ctrl + Enter to build</span>
                  <button className="btn btn-primary" onClick={handleStart} disabled={starting}>
                    {starting ? 'Starting...' : 'Build my page'}
                  </button>
                </div>
              </div>

              {error && <p className="hero-error">{error}</p>}

              <div className="chip-row">
                {starterChips.map((chip) => (
                  <button key={chip.label} className="chip" onClick={() => fillPrompt(chip.text)}>
                    {chip.label}
                  </button>
                ))}
              </div>

              <ul className="hero-points">
                {points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>

            <HeroDemo />
          </div>
        </div>
      </section>

      <section className="how paper-grid" id="how-it-works">
        <div className="section-inner">
          <div className="how-heading">
            <h2 className="section-title">From one sentence to a finished page</h2>
            <p className="section-text">No setup and no templates to pick from. You talk, and the page changes.</p>
          </div>

          <ol className="steps">
            {steps.map((step, index) => (
              <li className="step" key={step.title}>
                <StepArt kind={step.art} />
                <div className="step-head">
                  <span className="step-number">{index + 1}</span>
                </div>
                <h3 className="step-title">{step.title}</h3>
                <p className="step-text">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="ideas" id="ideas">
        <div className="section-inner">
          <h2 className="section-title section-title-light">Not sure what to build? Start from one of these.</h2>
          <ul className="idea-list">
            {ideas.map((idea) => (
              <li key={idea}>
                <button className="idea-row" onClick={() => fillPrompt(idea)}>
                  <span className="idea-text">{idea}</span>
                  <span className="idea-action">Use this idea</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="closing paper-grid">
        <div className="section-inner closing-inner">
          <h2 className="closing-title">Your next page is one sentence away.</h2>
          <button className="btn btn-primary btn-large" onClick={() => fillPrompt('')}>
            Build my page
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="section-inner landing-footer-inner">
          <Logo />
          <p>Built with React, Express, MongoDB and Gemini.</p>
        </div>
      </footer>
    </div>
  )
}

export default Landing
