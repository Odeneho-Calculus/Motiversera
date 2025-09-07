import { Link } from 'react-router-dom'
import './App.css'

export default function App() {
  return (
    <main style={{ padding: 24 }}>
      <h1>Motiversera</h1>
      <p>Scaffolded. Use navigation to access features.</p>
      <nav style={{ display: 'flex', gap: 12 }}>
        <Link to="/editor">Editor</Link>
        <Link to="/gallery">Gallery</Link>
        <Link to="/export">Export</Link>
      </nav>
    </main>
  )
}
