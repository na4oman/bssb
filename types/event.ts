export type EventComment = {
  id: string
  userId: string
  userName: string
  text: string
  imageUrl?: string
  timestamp: Date
}

export type EventAttendee = {
  userId: string
  userName: string
  status: 'going' | 'maybe' | 'not going'
}

export type EventLocation = {
  latitude: number
  longitude: number
}

export type Event = {
  id: string
  title: string
  date: Date
  location: string
  locationCoordinates?: EventLocation
  description: string
  imageUrl?: string
  createdBy: {
    userId: string
    userName: string
  }
  likes: string[]
  comments: EventComment[]
  attendees: EventAttendee[]
  createdAt?: Date
}
