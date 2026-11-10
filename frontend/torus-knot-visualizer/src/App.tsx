import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import MainView from './pages/home/Home';
import Gallery from './pages/gallery/Gallery';
import DesignDetail from './pages/design/Design';
import NavBar from './components/header/NavBar';

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/design/:id" element={<DesignDetail />} />
      </Routes>
    </Router>
  );
}

export default App;
