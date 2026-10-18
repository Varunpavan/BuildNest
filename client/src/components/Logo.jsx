import { Link } from 'react-router-dom'
import '../styles/navbar.css'

// light = true when the logo sits on a dark (navy) background
function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className={light ? 'logo logo-light' : 'logo'}>
      <span className="logo-mark">
        <span className="logo-block logo-block-one"></span>
        <span className="logo-block logo-block-two"></span>
      </span>
      <span className="logo-name">NxtBuild</span>
    </Link>
  )
}

export default Logo
