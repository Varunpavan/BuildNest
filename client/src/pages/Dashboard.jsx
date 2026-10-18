import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import api from '../api/api.js'
import Navbar from '../components/Navbar.jsx'
import ProjectCard from '../components/ProjectCard.jsx'
import '../styles/dashboard.css'

function Dashboard() {
  const { user } = useContext(AuthContext)
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    let fetchProjects = async () => {
      try {
        let response = await api.get('/projects')
        setProjects(response.data.projects)
      } catch (err) {
        console.log(err)
        setError('We could not load your projects. Refresh the page to try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [])

  let handleNewProject = async () => {
    setCreating(true)
    try {
      let response = await api.post('/projects', {})
      navigate(`/builder/${response.data.project._id}`)
    } catch (err) {
      console.log(err)
      setError('We could not create a project. Please try again.')
      setCreating(false)
    }
  }

  let handleDelete = async (id) => {
    let sure = window.confirm('Delete this project? This cannot be undone.')
    if (!sure) return

    try {
      await api.delete(`/projects/${id}`)
      setProjects(projects.filter((project) => project._id !== id))
    } catch (err) {
      console.log(err)
      setError('We could not delete that project. Please try again.')
    }
  }

  let firstName = user.name.split(' ')[0]

  return (
    <div className="dashboard-page">
      <Navbar />

      <main className="dashboard">
        <div className="dashboard-head">
          <div>
            <h1 className="dashboard-title">Hi {firstName}, what are we building?</h1>
            <p className="dashboard-count">
              {projects.length === 1 ? '1 project' : `${projects.length} projects`}
            </p>
          </div>
          <button className="btn btn-primary" onClick={handleNewProject} disabled={creating}>
            {creating ? 'Creating...' : 'New project'}
          </button>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {loading && <p className="dashboard-status">Loading your projects...</p>}

        {!loading && projects.length === 0 && !error && (
          <div className="empty">
            <h2 className="empty-title">Nothing here yet.</h2>
            <p className="empty-text">
              Your first page is one sentence away. Start a project and describe what you want to see.
            </p>
            <button className="btn btn-primary" onClick={handleNewProject} disabled={creating}>
              Start your first project
            </button>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="project-grid">
            <button className="project-new" onClick={handleNewProject} disabled={creating}>
              <span className="project-new-plus"></span>
              <span className="project-new-text">{creating ? 'Creating...' : 'New project'}</span>
            </button>
            {projects.map((project) => (
              <ProjectCard key={project._id} project={project} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard
