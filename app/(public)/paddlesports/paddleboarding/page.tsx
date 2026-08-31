import type { Metadata } from 'next'

import { SportPage } from '@/components/site/sport-page'
import { IMAGES } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Paddleboarding',
  description:
    'Standup paddleboarding at Telford Canoe Club — one of the most accessible watersports in the world, from gentle river paddles to whitewater SUP.',
}

export default function PaddleboardingPage() {
  return (
    <SportPage
      title="Standup paddleboarding"
      intro="One of the most popular watersports in the world — and one of the easiest to start."
      heroImage={IMAGES.sup}
      heroImageAlt="Paddleboarders out on the water"
      closing="Fancy a calmer kind of paddle?"
      sections={[
        {
          paragraphs: [
            'Standup paddleboarding is one of the most popular watersports anywhere, and it keeps growing because it’s so easy for new participants to pick up. Born out of surfing — its modern origins in early-1900s Hawaii, though people have stood on boards with paddles as far back as 3000 BC — modern SUP is simple: stand on a large board and propel yourself with a long paddle.',
          ],
          image: IMAGES.sup,
          imageAlt: 'A paddleboarder messing around on the river',
          caption: 'Messing around on the river',
        },
        {
          heading: 'An incredibly varied sport',
          paragraphs: [
            'Paddleboarders can enjoy gentle paddles down a flat river, canal or lake; surf in the sea; run whitewater; race; even head out on coastal expeditions. Today’s most popular boards are inflatable — easy to transport and light to carry — though hard composite boards are available too.',
            'Even on flat water, paddleboarding is a great workout, building balance and core strength without the sweat of a gym.',
          ],
          image: IMAGES.rapid,
          imageAlt: 'Calm water above the rapids',
          caption: 'Chilled-out paddling on flat water',
        },
        {
          heading: 'SUP at Telford Canoe Club',
          paragraphs: [
            'The club makes every effort to promote paddleboarding because of its inclusivity and the wide range of people who can take part. It’s a favourite on our long summer evening sessions and weekend trips — and a lovely counterpoint to a day on the rapid.',
          ],
          image: IMAGES.hero,
          imageAlt: 'The river at Jackfield on a summer evening',
          caption: 'Summer evenings on the Severn',
        },
      ]}
    />
  )
}
