// src/utils/types.ts

/** Generic media item (image/video/etc.) */
export type Media = {
  url: string
  alt?: string
}

/** User profile object (Noroff v2) */
export type Profile = {
  name: string
  email: string
  avatar?: Media
  banner?: Media
  venueManager?: boolean
  /** Access token is only present when logging in */
  accessToken?: string
}

/** Venue location fields (not all are always set) */
export type VenueLocation = {
  address?: string
  city?: string
  zip?: string
  country?: string
  continent?: string
}

/** Owner data attached to a Venue */
export type VenueOwner = {
  name: string
  email: string
  avatar?: Media
}

/** Extra metadata about a Venue */
export type VenueMeta = {
  wifi?: boolean
  parking?: boolean
  breakfast?: boolean
  pets?: boolean
}

/** Venue object */
export type Venue = {
  id: string
  name: string
  description?: string
  media: Media[]
  price: number
  rating?: number
  maxGuests?: number

  location?: VenueLocation
  owner?: VenueOwner
  meta?: VenueMeta

  /** Bookings are only present when explicitly requested with `_bookings=true` */
  bookings?: Booking[]
  _count?: { bookings: number }

  created: string
  updated: string
}

/** Booking object */
export type Booking = {
  id: string
  dateFrom: string
  dateTo: string
  guests: number

  venueId?: string
  venue?: Venue

  created?: string
}
