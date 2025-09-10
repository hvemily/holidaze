// src/utils/types.ts
export type Media = { url: string; alt?: string }
export type VenueMedia = { url: string; alt?: string }

export type Profile = {
  name: string
  email: string
  avatar?: Media
  banner?: Media
  venueManager?: boolean
  accessToken?: string
}

export type VenueMeta = {
  wifi?: boolean
  parking?: boolean
  breakfast?: boolean
  pets?: boolean
}

export type VenueLocation = {
  address?: string
  city?: string
  zip?: string
  country?: string
  continent?: string
}

export type VenueOwner = {
  name: string
  email: string
  avatar?: VenueMedia
}

export type Venue = {
  id: string
  name: string
  description?: string
  media: VenueMedia[]
  price: number
  rating?: number
  created: string          // 👈 legg til
  updated: string          // 👈 legg til
  location?: VenueLocation
  owner?: VenueOwner
  _count?: { bookings: number }
}

export type Booking = {
  id: string
  dateFrom: string
  dateTo: string
  guests: number
  venueId?: string
  venue?: Venue
  created?: string
}
