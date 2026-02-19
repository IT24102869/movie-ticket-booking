import React from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import MoviesPage from '../pages/MoviesPage'
import MovieDetailsPage from '../pages/MovieDetailsPage'
import SeatSelectionPage from '../pages/SeatSelectionPage'
import MyBookingsPage from '../pages/MyBookingsPage'
import AddMoviePage from '../pages/AddMoviePage'
import EditMoviePage from '../pages/EditMoviePage'
import ScheduleShowtimePage from '../pages/ScheduleShowtimePage'
import ShowPage from '../pages/Show'
import RecommendationsPage from '../pages/RecommendationsPage'

export default function App() {
  return (
    <>
      <div className="nav">
        <div className="row" style={{gap: 10}}>
          <div className="brand"><Link to="/">🎟️ MovieTickets</Link></div>
          <div className="small" style={{opacity: 0.75}}>React + FastAPI + MySQL</div>
        </div>
        <div className="navlinks">
          <Link to="/">Movies</Link>
          <Link to="/movies/add">Add Movie</Link>
          <Link to="/recommendations">For You</Link>
          <Link to="/bookings">My Bookings</Link>
        </div>
      </div>

      <div className="container">
        <Routes>
          <Route path="/" element={<MoviesPage />} />
          <Route path="/movies/add" element={<AddMoviePage />} />
          <Route path="/movies/:id" element={<MovieDetailsPage />} />
          <Route path="/movies/:id/edit" element={<EditMoviePage />} />
          <Route path="/movies/:id/show" element={<ShowPage />} />
          <Route path="/movies/:movieId/schedule" element={<ScheduleShowtimePage />} />
          <Route path="/showtimes/:id/seats" element={<SeatSelectionPage />} />
          <Route path="/recommendations" element={<RecommendationsPage />} />
          <Route path="/bookings" element={<MyBookingsPage />} />
        </Routes>
      </div>
    </>
  )
}
