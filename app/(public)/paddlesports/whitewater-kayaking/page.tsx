import type { Metadata } from 'next'

import { SportPage } from '@/components/site/sport-page'
import { IMAGES } from '@/lib/site-data'

export const metadata: Metadata = {
  title: 'Whitewater kayaking',
  description:
    'Whitewater kayaking is the core of Telford Canoe Club — like a river version of skiing, for all abilities, with summer evening sessions on our own rapid at Jackfield.',
}

export default function WhitewaterPage() {
  return (
    <SportPage
      title="Whitewater kayaking"
      intro="The core of Telford Canoe Club — the art of navigating a craft down a fast-moving river."
      heroImage={IMAGES.hero}
      heroImageAlt="The rapid at Jackfield from above"
      closing="Start your whitewater journey with us"
      sections={[
        {
          paragraphs: [
            'Simply put, whitewater kayaking is the art of navigating a craft down a fast-moving river. If it has a comparison in other sports, it would be a river version of skiing: a gravity-based sport — but one where participants work as a group to make their way downstream, making the most of the features they meet on the way.',
            'It’s a great way to spend time outdoors at any time of year, and a pastime that can take you all over the world if you want it to.',
          ],
          image: IMAGES.whitewater,
          imageAlt: 'Kayaker relaxing on a wave on the River Dee',
          caption: 'The less extreme end — chilling out on a wave on the River Dee in North Wales',
        },
        {
          heading: 'As mellow or as extreme as you like',
          paragraphs: [
            'Despite the images you may have seen of paddlers launching off waterfalls, whitewater is graded from two to five — two the easiest, five the hardest — and there’s a grade for everyone. Beyond river trips there are also whole subsets to explore, from the dynamic tricks of freestyle to the technical racing of slalom.',
            'Whitewater kayaking at Telford Canoe Club suits all abilities. Whether you want a chilled-out day on the river or to push yourself, trips run to suit different skill levels and experience.',
          ],
          image: IMAGES.newsFreestyle,
          imageAlt: 'A member running a big rapid',
          caption: 'One of our members running a waterfall in Norway',
        },
        {
          heading: 'Learn on our own rapid',
          paragraphs: [
            'During the summer months we run regular evening sessions at Jackfield Rapids, where the club has full parking right next to the river. From your first steps in controlling a boat to your first kayak roll, our experienced, qualified coaches and guides are well placed to start you on your kayaking journey — safely, and at your pace.',
          ],
          image: IMAGES.anomaly,
          imageAlt: 'Paddlers on the water at Jackfield Rapids',
          caption: 'Summer evening session on the wave at Jackfield',
        },
      ]}
    />
  )
}
