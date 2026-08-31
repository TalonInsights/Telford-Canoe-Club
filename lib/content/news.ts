import { IMAGES } from '@/lib/site-data'

/**
 * The club's real news archive, migrated in full from the current site
 * (§10.1) with light copy-editing for sentence case and flow. New posts are
 * written through the committee CMS when Phase 7 lands; these three render
 * statically so nothing depends on the database being connected.
 */

export type NewsPost = {
  slug: string
  title: string
  excerpt: string
  author: string
  category: string
  publishedAt: string
  image: string | null
  imageAlt: string
  body: { heading?: string; paragraphs: string[] }[]
}

export const newsPosts: NewsPost[] = [
  {
    slug: 'paddle-uk-club-membership',
    title: 'Paddle UK club membership',
    excerpt:
      'Please add Telford Canoe Club to your JustGo profile — it keeps our Paddle UK affiliation records straight and saves the club money.',
    author: 'Simon Wiles',
    category: 'Membership',
    publishedAt: '2026-05-23',
    image: null,
    imageAlt: '',
    body: [
      {
        paragraphs: [
          'Please can I ask that all club members update their JustGo profile to add Telford Canoe Club? JustGo is the Paddle UK membership portal, at paddleuk.justgo.com.',
          'If members are Paddle UK members, the club doesn’t have to pay the per-person charge for club affiliation — so a minute of your time genuinely saves the club money.',
          'If you can’t see Telford Canoe Club in the portal, drop me a message privately with your Paddle UK membership number and date of birth and I can add you manually.',
          'If you could also add your Paddle UK membership number (if you are an on-the-water member) to your TCC profile on the club site, that would really help us line things up too.',
          'Thanks — Simon',
        ],
      },
    ],
  },
  {
    slug: 'tcc-committee',
    title: 'TCC committee',
    excerpt:
      'Enough volunteers came forward to fill the required committee roles — the club remains viable, and the site stays open.',
    author: 'Simon Wiles',
    category: 'Club news',
    publishedAt: '2026-04-18',
    image: null,
    imageAlt: '',
    body: [
      {
        paragraphs: [
          'Great news: we have had enough volunteers (just) to fulfil the required committee roles and remain viable as a club. Thank you to the new and existing committee members — and to Iain, for all the hard work put in over the last few years.',
          'Going forward we will remain focused on management of the Telford Canoe Club site at Jackfield Rapids.',
          'As per the club constitution, we have distributed roles amongst the existing and new committee members, who will stand in these roles until the next AGM in September. I again encourage anyone who has an interest in taking the club forward, and has some time available to work on the committee or coach, to come forward.',
        ],
      },
      {
        heading: 'The new committee',
        paragraphs: [
          'Chairman — Simon Wiles. Treasurer — Josh Smyth. Secretary — Bek Farley-Brown. Membership secretary — Susanna Smyth. Committee member — David Allen. Freestyle lead — Simon Wyndham.',
          'The site is open as normal for use by competent paddlers at their own risk, and we will look to re-establish evening and weekend club paddles on site in the future.',
          'The glitches on the website should now be fixed, and we welcome all previous and prospective members to join up.',
        ],
      },
    ],
  },
  {
    slug: 'freestyle-coaching-jackfield-matt-stephenson',
    title: 'Freestyle coaching at Jackfield with Matt Stephenson',
    excerpt:
      'Another open freestyle day on our own wave — this time with C1 world freestyle champion Matt Stephenson.',
    author: 'Simon Wyndham',
    category: 'Events',
    publishedAt: '2025-08-09',
    image: IMAGES.newsFreestyle,
    imageAlt: 'Freestyle kayaker playing the wave at Jackfield',
    body: [
      {
        paragraphs: [
          'Thursday 7 August saw Telford Canoe Club holding another open freestyle day at Jackfield, with C1 world champion Matt Stephenson.',
          'Continuing the club’s mission of promoting freestyle kayaking, we held another of our periodic open freestyle sessions. Throughout the winter we hold these events at the swimming pool, but summer brings with it the opportunity to have coaching on our local wave at Jackfield Rapids. The sessions are open to members of any club in the area, and we strive to bring in some of the best expertise in the country to help develop skills, whether participants are new to the sport or highly experienced.',
          'This week we brought in C1 world freestyle champion Matt Stephenson. After the success of the freestyle sessions at our recent Paddlefest, we had a number of requests to hold another day with him. How could we not oblige?',
        ],
      },
      {
        heading: 'A little help from the Clywedog',
        paragraphs: [
          'With the lack of rain, we had been a bit concerned that river levels would be on the low side. The wave at Jackfield does work quite well at low levels, but a little top-up does wonders to make entry a little less rocky. Luckily one of the Severn’s tributaries, the Clywedog, was having a dam release, which added a few centimetres to the levels.',
          'The day began with flat-water skills on the section above the rapids. Dave got some pointers to develop a flat-water loop and improve his cartwheel technique, while Steph worked on her double pump to get the boat vertical.',
          'After the flat-water session it was time to move down to the wave. Progress was made all round, with Ingela once again standing out as she advanced her wave-surfing, and Dave — never happy unless his boat is vertical — gaining important pointers on cartwheels, spins and roundhouses.',
          'Although the day was supposed to be warm and sunny, we were treated to an extended deluge of rain. It rained so hard that the usually slow-to-respond Severn actually rose slightly while we were there, improving the feature further by late afternoon.',
          'All in all, another successful freestyle session. Look out for more to follow.',
        ],
      },
    ],
  },
]

export function getNewsPost(slug: string): NewsPost | undefined {
  return newsPosts.find((p) => p.slug === slug)
}
