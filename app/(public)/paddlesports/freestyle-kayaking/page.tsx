import type { Metadata } from 'next'

import { SportPage } from '@/components/site/sport-page'
import { IMAGES } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Freestyle kayaking',
  description:
    'Freestyle is the most dynamic side of whitewater paddling — tricks on a wave or hole, workshops with GB team paddlers, and huge benefits for the rest of your paddling.',
}

export default function FreestylePage() {
  return (
    <SportPage
      title="Freestyle kayaking"
      intro="The most dynamic subset of whitewater paddlesports — and a huge part of this club's identity."
      heroImage={IMAGES.freestyle}
      heroImageAlt="A freestyle kayaker throwing big air"
      closing="Come and get (very) wet with us"
      sections={[
        {
          paragraphs: [
            'If you’ve ever seen someone paddling a very short, stumpy-looking kayak, the chances are it was a modern freestyle boat. Freestyle is, quite simply, performing tricks in your kayak or canoe on a feature such as a wave or a hole — or even on flat water. Think slopestyle in snowboarding, or the half-pipe in skateboarding: the BMX of kayaking, though there’s much more to it than that.',
            'At the extreme end, freestyle kayakers throw huge loops into the air and link impressive combinations of moves. But freestyle isn’t just for advanced paddlers — it’s for everyone, from beginners to veterans who have only ever paddled river boats. Enjoy a soul surf carving along a green wave, spin your boat, or push for aerial moves: there’s an aspect of freestyle for any paddler at any level.',
          ],
          image: IMAGES.freestyle,
          imageAlt: 'A freestyle kayaker throws huge air',
          caption: 'Throwing huge air at Nottingham. Photo: Simon Wyndham',
        },
        {
          heading: 'Why freestyle makes every paddler better',
          paragraphs: [
            'Freestyle carries over into everything else you do in a boat. It sharpens your balance and awareness, tightens your boat control, and teaches you to stay composed under pressure — skills that help you handle features on any river run.',
            'It will also hugely improve your roll. Yes — you will be getting very wet indeed, very often. The result is confidence: a reliable roll in all sorts of situations and positions.',
          ],
          image: IMAGES.newsFreestyle,
          imageAlt: 'Surfing the wave at Jackfield',
          caption: 'Surfing on the wave — the club’s own freestyle playground',
        },
        {
          heading: 'Workshops, Burners and world champions',
          paragraphs: [
            'Telford Canoe Club actively grows the opportunities for members to try freestyle because of the benefits it brings. We organise regular workshops with GB freestyle team members — recent sessions have been coached by C1 world champion Matt Stephenson — and many of our talented younger members take part in national grass-roots freestyle schemes such as the Burners events.',
            'And freestyle isn’t just for the young: paddlers of every age benefit, as long as they expect to go upside down a lot. It’s about experimentation and sheer fun on the water — a big part of the club’s ethos of opening up every kind of paddlesport to members.',
          ],
          image: IMAGES.anomaly,
          imageAlt: 'Paddlers session the wave at Jackfield',
          caption: 'Open freestyle day on the Jackfield wave',
        },
      ]}
    />
  )
}
