import { Link } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import '../styles/login.css'

function NotFound() {
  return (
    <div className="notfound">
      <Logo />
      <h1 className="notfound-title">This page does not exist.</h1>
      <p className="notfound-text">The link may be old, or the address has a typo.</p>
      <Link to="/" className="btn btn-dark">
        Go to the home page
      </Link>
    </div>
  )
}

export default NotFound
