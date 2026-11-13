import { NavLink } from 'react-router-dom';
import './NavBar.css';

function NavBar() {
  return (
    <header className="navbar-header">
      <NavLink to="/" end className="navbar-brand" aria-label="Knot Studio home">
        <span className="navbar-glyph" aria-hidden="true">⌘</span>
        <span>CHAOS<span className="brand-accent">/</span>STUDIO</span>
      </NavLink>
      <nav className="navbar-nav" aria-label="Main navigation">
        <NavLink to="/">Studio</NavLink>
        <NavLink to="/gallery">Gallery</NavLink>
      </nav>
      <span className="navbar-status"><span aria-hidden="true" />SYSTEM ONLINE</span>
    </header>
  );
}

export default NavBar;
