import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import Logo from './Logo.jsx'
import '../styles/navbar.css'

function Navbar() {
  const { user, logout } = useContext(AuthContext)
  const navigate = useNavigate()

  let handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <Logo to="/dashboard" light />

      <nav className="navbar-right">
        <Link to="/dashboard" className="navbar-link">
          Projects
        </Link>
        {user && (
          <span className="navbar-user">
            <span className="avatar">{user.name.charAt(0).toUpperCase()}</span>
            <span className="navbar-username">{user.name}</span>
          </span>
        )}
        <button className="btn btn-outline-light btn-small" onClick={handleLogout}>
          Log out
        </button>
      </nav>
    </header>
  )
}

export default Navbar
