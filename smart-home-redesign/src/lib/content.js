// Content model for the exploration.
// Product facts, plan names and prices follow Sky's public Smart Home pages
// and launch coverage (checked October 2026). Copy is rewritten for the
// prototype; prices are illustrative and may have changed.

export const plans = [
  {
    id: 'plan',
    name: 'Smart Home Plan',
    monthly: 5,
    upfront: 15,
    includes: 'Smart Doorbell',
    detail: 'Video doorbell with chime',
  },
  {
    id: 'plan-plus',
    name: 'Smart Home Plan+',
    monthly: 8,
    upfront: 20,
    includes: 'Smart Doorbell + Indoor Camera',
    detail: 'Add sensor packs any time',
  },
];

export const planFeatures = [
  { id: 'rec', title: 'Video recording', body: 'Every alert is saved as a clip, so nothing important slips by.' },
  { id: 'cloud', title: '30-day cloud storage', body: 'Scroll back through a month of footage from the app.' },
  { id: 'zones', title: 'Custom activity zones', body: 'Draw the areas that matter. Ignore the street beyond the gate.' },
  { id: 'alerts', title: 'Smart alerts', body: 'Know whether it was a person, a parcel or just the wind.' },
  { id: 'share', title: 'Clip sharing', body: 'Send a clip to family or a neighbour in a couple of taps.' },
];

export const doorbell = {
  eyebrow: 'Smart Doorbell',
  plan: 'Included with Smart Home Plan',
  steps: [
    {
      id: 'hd',
      kicker: '1080p HD',
      title: 'See who’s there.',
      body: 'Full HD video streams to your phone the moment someone presses the bell — or before they do.',
    },
    {
      id: 'night',
      kicker: 'Night vision',
      title: 'Day or night.',
      body: 'Infrared night vision keeps the picture clear after dark, so a late delivery never goes unseen.',
    },
    {
      id: 'talk',
      kicker: 'Two-way talk',
      title: 'Answer from anywhere.',
      body: 'Speak to visitors from the office, the train or the sofa. They’ll never know you’re not home.',
    },
  ],
  chat: [
    { from: 'them', text: 'Hiya — parcel for number 12!' },
    { from: 'you', text: 'Brilliant, thanks. Could you pop it behind the plant pot?' },
    { from: 'them', text: 'Done. Have a good one!' },
  ],
};

export const indoor = {
  eyebrow: 'Indoor Camera & sensors',
  plan: 'Requires Smart Home Plan+',
  camera: ['1080p HD', 'Night vision', 'Two-way talk', 'Motion alerts'],
  sensors: [
    {
      id: 'contact',
      room: 'Front door',
      device: 'Contact sensor',
      alert: 'Front door opened',
      time: '18:42',
    },
    {
      id: 'motion',
      room: 'Hallway',
      device: 'Motion sensor',
      alert: 'Movement in the hallway',
      time: '18:43',
    },
    {
      id: 'camera',
      room: 'Living room',
      device: 'Indoor Camera',
      alert: 'Person seen in the living room',
      time: '18:43',
    },
    {
      id: 'leak',
      room: 'Kitchen',
      device: 'Leak sensor',
      alert: 'Water detected under the sink',
      time: '21:07',
    },
  ],
  bridge: {
    title: 'One Sensor Bridge.',
    body: 'It plugs into the back of your Indoor Camera, and every sensor in the house joins the conversation. You only ever need one.',
  },
  packs: [
    { id: 'motion', name: 'Motion Pack', price: 35, contents: '1 motion sensor, 2 contact sensors' },
    { id: 'leak', name: 'Leak Pack', price: 40, contents: '3 leak sensors, Sensor Bridge' },
  ],
};
