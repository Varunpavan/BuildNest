import { Link } from 'react-router-dom'
import '../styles/dashboard.css'

function ProjectCard({ project, onDelete }) {
  let editedOn = new Date(project.updatedAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  let handleDelete = () => {
    onDelete(project._id)
  }

  return (
    <article className="project-card">
      <Link to={`/builder/${project._id}`} className="project-thumb" aria-label={`Open ${project.title}`}>
        {project.code ? (
          // sandbox="" means no scripts run in the small preview
          <iframe
            className="project-thumb-frame"
            srcDoc={project.code}
            sandbox=""
            title={`Preview of ${project.title}`}
            tabIndex={-1}
          />
        ) : (
          <span className="project-thumb-empty">Nothing built yet</span>
        )}
      </Link>

      <div className="project-info">
        <div>
          <h3 className="project-title">{project.title}</h3>
          <p className="project-date">Edited {editedOn}</p>
        </div>
        <button className="project-delete" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </article>
  )
}

export default ProjectCard
