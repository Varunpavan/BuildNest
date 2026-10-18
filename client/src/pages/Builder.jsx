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
  const [device, setDevice] = useState('desktop')
  const [mobilePane, setMobilePane] = useState('chat')

  // load the project when the page opens
  useEffect(() => {
    let fetchProject = async () => {
      try {
        let response = await api.get(`/projects/${id}`)
        let project = response.data.project
        setTitle(project.title)
        setCode(project.code)
        setMessages(project.messages)
        setLoading(false)

        // the landing page and dashboard can send us here with a first prompt
        let firstPrompt = location.state && location.state.prompt
        if (firstPrompt) {
          // clear it so a page refresh does not send it again
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

  // asks the server to build or change the page
  let sendPrompt = async (text, currentMessages) => {
    let userMessage = { role: 'user', text: text }

    setMessages([...currentMessages, userMessage])
    setPrompt('')
    setGenerating(true)

    try {
      // if the person edited the code by hand, save it first so the AI changes THEIR version
      if (unsaved) {
        await api.put(`/projects/${id}`, { title: title, code: code })
        setUnsaved(false)
      }

      let response = await api.post(`/projects/${id}/generate`, { prompt: text })
      let project = response.data.project

      setCode(project.code)
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

  let handleSend = () => {
    let text = prompt.trim()
    if (text === '' || generating) return
    sendPrompt(text, messages)
  }

  // typing in the code tab changes the page right away, but it is not saved until the person clicks Save
  let handleCodeChange = (newCode) => {
    setCode(newCode)
    setUnsaved(true)
  }

  let handleTitleChange = (event) => {
    setTitle(event.target.value)
  }

  let handleTitleBlur = async () => {
    let cleanTitle = title.trim() === '' ? 'Untitled project' : title.trim()
    setTitle(cleanTitle)

    try {
      await api.put(`/projects/${id}`, { title: cleanTitle })
    } catch (err) {
      console.log(err)
    }
  }

  let handleSave = async () => {
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

  // makes a file out of the code and clicks a hidden link to download it
  let handleDownload = () => {
    let blob = new Blob([code], { type: 'text/html' })
    let url = URL.createObjectURL(blob)
    let link = document.createElement('a')
    let fileName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'my-page'

    link.href = url
    link.download = `${fileName}.html`
    link.click()
    URL.revokeObjectURL(url)
  }

  let showChat = () => {
    setMobilePane('chat')
  }

  let showPreview = () => {
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
