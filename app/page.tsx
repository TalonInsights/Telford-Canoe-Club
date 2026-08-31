import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { HomeHero } from '@/components/site/home-hero'

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <HomeHero
          title="Paddle the Severn with Telford Canoe Club"
          intro="Whitewater kayaking, freestyle and paddleboarding from our own rapids at Jackfield, in the Ironbridge gorge."
          image="/images/placeholders/hero-jackfield.jpg"
          imageAlt="Looking down on the River Severn rapids at Jackfield with kayakers on the water"
          primary={{ label: 'Join the club', href: '/join' }}
          secondary={{ label: "See what's on", href: '/events' }}
        />
        <div className="py-section" aria-hidden="true" />
      </main>
      <Footer />
    </>
  )
}
