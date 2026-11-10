export type Mode = 'original' | 'brand' | 'product' | 'systems' | 'connected'
export type Lens = 'brand' | 'product' | 'systems'
export type Brew = 'espresso' | 'filter' | 'cafetiere'
export type Intent = 'everyday' | 'new' | 'gift'

export const flagsFor = (m: Mode) => ({
  brand: m === 'brand' || m === 'connected',
  product: m === 'product' || m === 'connected',
  systems: m === 'systems' || m === 'connected',
})

export interface LensInfo {
  id: Mode
  index: string
  label: string
  question: string
  intervention: string
  limit: string
}

export const LENSES: LensInfo[] = [
  {
    id: 'original',
    index: '00',
    label: 'As it is',
    question: 'Why aren’t people acting?',
    intervention: 'A generic promise, nine look-alike choices and messages that contradict each other.',
    limit: 'Try adding something to the basket.',
  },
  {
    id: 'brand',
    index: '01',
    label: 'Brand',
    question: 'Do people care?',
    intervention: 'A distinct proposition and voice give people a reason to stay.',
    limit: 'Still breaks: nine near-identical choices, and the basket still needs a grind it never asked for.',
  },
  {
    id: 'product',
    index: '02',
    label: 'Product',
    question: 'Can people decide?',
    intervention: 'Two questions replace nine options, so the next step is obvious.',
    limit: 'Still breaks: the decision is easy, but nothing makes people want to make it.',
  },
  {
    id: 'systems',
    index: '03',
    label: 'Systems',
    question: 'What connects the experience?',
    intervention: 'Intent is captured once and carried through every message, choice and action.',
    limit: 'Still breaks: the wiring works, but it carries a generic promise and too many choices.',
  },
]

export const CONNECTED: LensInfo = {
  id: 'connected',
  index: '04',
  label: 'Connected',
  question: 'What happens when they work together?',
  intervention: 'Brand gives the reason, product gives the decision, systems carry both to a meaningful next action.',
  limit: '',
}

export interface Product {
  id: string
  code: string
  name: string
  brandName: string
  brandNote: string
  price: number
  priceNote?: string
  tags: string[]
  intents: Intent[]
  bag: string
}

export const PRODUCTS: Product[] = [
  { id: 'house-250', code: 'NF-HB-250', name: 'House Blend 250g', brandName: 'First Light', brandNote: 'The everyday roast. Milk chocolate, almond.', price: 9.5, tags: ['BESTSELLER'], intents: ['everyday'], bag: '#B4462B' },
  { id: 'house-1kg', code: 'NF-HB-1000', name: 'House Blend 1kg', brandName: 'First Light, large', brandNote: 'The same mornings, four times over.', price: 31, tags: ['SAVE 18%'], intents: ['everyday'], bag: '#8E3721' },
  { id: 'dark-2', code: 'NF-B2-DK', name: 'Blend No. 2 (Dark)', brandName: 'Long Shadow', brandNote: 'Dark, smoky, unhurried.', price: 10, tags: ['SALE', '-10%'], intents: ['everyday'], bag: '#2B2118' },
  { id: 'eth', code: 'ETH-YRG-W', name: 'Ethiopia Origin W', brandName: 'Yirgacheffe', brandNote: 'Jasmine and lemon. A bright start.', price: 13.5, tags: ['NEW'], intents: ['new'], bag: '#C99A3B' },
  { id: 'col', code: 'COL-HUI-N', name: 'Colombia Origin N', brandName: 'Huila', brandNote: 'Red berries, brown sugar.', price: 12, tags: ['LIMITED'], intents: ['new'], bag: '#7A3B3B' },
  { id: 'esp', code: 'NF-ESP-PRO', name: 'Espresso Pro Blend', brandName: 'Small Hours', brandNote: 'Dense and chocolatey. Built for milk.', price: 11, tags: ['STAFF PICK'], intents: ['everyday'], bag: '#3F4A36' },
  { id: 'decaf', code: 'NF-DC-SWP', name: 'Decaf SWP', brandName: 'Late Light', brandNote: 'All of the ritual, none of the buzz.', price: 11.5, tags: [], intents: ['everyday'], bag: '#6B7A8C' },
  { id: 'sampler', code: 'NF-SMP-3', name: 'Sampler Pack x3', brandName: 'Three Mornings', brandNote: 'Three roasts, three different starts.', price: 24, tags: ['GIFT', '-15%'], intents: ['new', 'gift'], bag: '#5E6B4E' },
  { id: 'gift', code: 'NF-GFT-CRD', name: 'Gift Card', brandName: 'A Better Morning', brandNote: 'For someone whose mornings need it.', price: 20, priceNote: 'from', tags: ['GIFT'], intents: ['gift'], bag: '#D4B48A' },
]

export const BREWS: { id: Brew; label: string; brandLabel: string; productId: string; grind: string }[] = [
  { id: 'espresso', label: 'Espresso machine', brandLabel: 'A short, strong espresso', productId: 'esp', grind: 'Fine, for espresso' },
  { id: 'filter', label: 'Filter / pour-over', brandLabel: 'A slow pour-over', productId: 'house-250', grind: 'Medium, for filter' },
  { id: 'cafetiere', label: 'Cafetière', brandLabel: 'A cafetière for two', productId: 'dark-2', grind: 'Coarse, for cafetière' },
]

export const INTENTS: { id: Intent; label: string }[] = [
  { id: 'everyday', label: 'My everyday coffee' },
  { id: 'new', label: 'Something new' },
  { id: 'gift', label: 'A gift' },
]

export const PROJECTS = [
  { id: 'sky-glass', title: 'Sky Glass', line: 'Simplifying complex purchase decisions.' },
  { id: 'sky-smart-home', title: 'Sky Smart Home', line: 'Connecting brand storytelling with product discovery.' },
  { id: 'lab', title: 'Experimental Lab', line: 'Exploring adaptive, behaviour-led experiences.' },
]

export const money = (n: number) => `£${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}`
