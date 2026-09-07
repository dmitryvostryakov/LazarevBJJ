import { useEffect, useState } from 'react'
import Navbar from './components/Navbar/Navbar'
import Hero from './components/Hero/Hero'
import About from './components/About/About'
import Schedule from './components/Schedule/Schedule'
import Gallery from './components/Gallery/Gallery'
import Reviews from './components/Reviews/Reviews'
import ContactForm from './components/ContactForm/ContactForm'
import Footer from './components/Footer/Footer'
import BookingStatus from './components/BookingStatus/BookingStatus'

function App() {
  const [bookingParams, setBookingParams] = useState(() => {
    const params = new URLSearchParams(window.location.search)
    const booking = params.get('booking')
    const token = params.get('token')
    return booking && token ? { id: booking, token } : null
  })

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
          }
        })
      },
      { threshold: 0.1 }
    )

    document.querySelectorAll('.fade-in').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  if (bookingParams) {
    return (
      <BookingStatus
        id={bookingParams.id}
        token={bookingParams.token}
        onClose={() => {
          window.history.replaceState({}, '', window.location.pathname)
          setBookingParams(null)
        }}
      />
    )
  }

  return (
    <>
      {/* SVG filters for GTA V comic/poster effect */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <filter id="gta-posterize">
            {/* Posterize: reduce color levels for comic book look */}
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="0 0.15 0.35 0.55 0.75 1" />
              <feFuncG type="discrete" tableValues="0 0.15 0.35 0.55 0.75 1" />
              <feFuncB type="discrete" tableValues="0 0.15 0.35 0.55 0.75 1" />
            </feComponentTransfer>
          </filter>
        </defs>
      </svg>
      <Navbar />
      <Hero />
      <About />
      <Schedule />
      <Gallery />
      <Reviews />
      <ContactForm />
      <Footer />
    </>
  )
}

export default App
