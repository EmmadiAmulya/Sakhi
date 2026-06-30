import { Link, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div>
      <nav>
        <Link to="/">Sakhi</Link>
        <div>
          <Link to="/">Home</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/cycle">Cycle</Link>
          <Link to="/calendar">Calendar</Link>
          <Link to="/education">Education</Link>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
