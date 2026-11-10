import { Link } from 'react-router-dom';
import './NavBar.css';

function NavBar() {
  return (
    <header className="navbar-header">
      <nav className="navbar-nav">
        <Link to="/">Home</Link>
        <Link to="/gallery">Gallery</Link>
      </nav>
    </header>
  );
}

export default NavBar;
