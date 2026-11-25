import { useState, useEffect, useContext } from 'react'
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import api from '../api/api.js'
import Logo from '../components/Logo.jsx'
import ChatPanel from '../components/ChatPanel.jsx'
import PreviewPanel from '../components/PreviewPanel.jsx'
import '../styles/builder.css'

function Builder() {
  const { user } = useContext(AuthContext)
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [messages, setMessages] = useState([])
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [unsaved, setUnsaved] = useState(false)
  const [tab, setTab] = useState('preview')
  // Responsive Default View:
  // On mobile screens (<= 768px), default to 'phone' view so mobile users immediately see a 1:1 view.
  // On laptops and desktop screens (> 768px), default to 'desktop' view for wide displays.
  const [device, setDevice] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return 'phone'
    }
    return 'desktop'
  })
  const [mobilePane, setMobilePane] = useState('chat')

  useEffect(() => {
    async function fetchProject() {
      try {
        let response = await api.get(`/projects/${id}`)
        let project = response.data.project
        setTitle(project.title)
        setCode(project.code ? project.code.replace(/nxt\s*[-_]?\s*build/gi, 'BuildNest') : '')
        setMessages(project.messages)
        setLoading(false)

        let firstPrompt = location.state && location.state.prompt
        if (firstPrompt) {
          navigate(location.pathname, { replace: true, state: null })
          sendPrompt(firstPrompt, project.messages)
        }
      } catch (err) {
        console.log(err)
        setLoadError('We could not open this project. It may have been deleted.')
        setLoading(false)
      }
    }

    fetchProject()
  }, [id])

  async function sendPrompt(text, currentMessages) {
    let userMessage = { role: 'user', text: text }

    setMessages([...currentMessages, userMessage])
    setPrompt('')
    setGenerating(true)

    try {
      if (unsaved) {
        await api.put(`/projects/${id}`, { title: title, code: code })
        setUnsaved(false)
      }

      let response = await api.post(`/projects/${id}/generate`, { prompt: text })
      let project = response.data.project

      setCode(project.code ? project.code.replace(/nxt\s*[-_]?\s*build/gi, 'BuildNest') : '')
      setMessages(project.messages)
      setTitle(project.title)
      setTab('preview')
      setMobilePane('preview')
    } catch (err) {
      console.log(err)
      let message = 'Something went wrong. Please try again.'
      if (err.response && err.response.data.message) {
        message = err.response.data.message
      }
      setMessages([...currentMessages, userMessage, { role: 'ai', text: message, isError: true }])
    } finally {
      setGenerating(false)
    }
  }

  function handleSend() {
    let text = prompt.trim()
    if (text === '' || generating) return
    sendPrompt(text, messages)
  }

  function handleCodeChange(newCode) {
    setCode(newCode)
    setUnsaved(true)
  }

  function handleTitleChange(event) {
    setTitle(event.target.value)
  }

  async function handleTitleBlur() {
    let cleanTitle = title.trim() === '' ? 'Untitled project' : title.trim()
    setTitle(cleanTitle)

    try {
      await api.put(`/projects/${id}`, { title: cleanTitle })
    } catch (err) {
      console.log(err)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await api.put(`/projects/${id}`, { title: title, code: code })
      setUnsaved(false)
    } catch (err) {
      console.log(err)
      alert('We could not save your changes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function handleDownload() {
    let blob = new Blob([code], { type: 'text/html' })
    let url = URL.createObjectURL(blob)
    let link = document.createElement('a')
    let fileName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-page'

    link.href = url
    link.download = `${fileName}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  function showChat() {
    setMobilePane('chat')
  }

  function showPreview() {
    setMobilePane('preview')
  }

  let statusText = 'All changes saved'
  if (generating) statusText = 'Building...'
  else if (saving) statusText = 'Saving...'
  else if (unsaved) statusText = 'Unsaved code changes'

  if (loading) {
    return (
      <div className="screen-loader">
        <span className="loader-blocks">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="notfound">
        <Logo to="/dashboard" />
        <h1 className="notfound-title">Project not found</h1>
        <p className="notfound-text">{loadError}</p>
        <Link to="/dashboard" className="btn btn-primary">
          Back to your projects
        </Link>
      </div>
    )
  }

  return (
    <div className="builder">
      <header className="builder-bar">
        <div className="builder-bar-left">
          <Logo to="/dashboard" light />
          <input
            className="title-input"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            maxLength="80"
            aria-label="Project name"
          />
        </div>

        <div className="builder-bar-right">
          <span className={unsaved ? 'save-status save-status-unsaved' : 'save-status'}>{statusText}</span>
          <button className="btn btn-outline-light btn-small" onClick={handleSave} disabled={!unsaved || saving}>
            Save
          </button>
          <button className="btn btn-primary btn-small" onClick={handleDownload} disabled={code === ''}>
            Download
          </button>
          {user && <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>}
        </div>
      </header>

      <div className="pane-switch">
        <div className="segmented">
          <button className={mobilePane === 'chat' ? 'segment segment-active' : 'segment'} onClick={showChat}>
            Chat
          </button>
          <button className={mobilePane === 'preview' ? 'segment segment-active' : 'segment'} onClick={showPreview}>
            Page
          </button>
        </div>
      </div>

      <div className={`builder-body builder-body-${mobilePane}`}>
        <ChatPanel
          messages={messages}
          prompt={prompt}
          setPrompt={setPrompt}
          onSend={handleSend}
          generating={generating}
        />
        <PreviewPanel
          code={code}
          setCode={handleCodeChange}
          tab={tab}
          setTab={setTab}
          device={device}
          setDevice={setDevice}
          generating={generating}
        />
      </div>
    </div>
  )
}

export default Builder
