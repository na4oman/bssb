export type EventComment = {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: Date
}

export type EventAttendee = {
  userId: string
  userName: string
  status: 'going' | 'maybe' | 'not going'
}

export type Event = {
  id: string
  title: string
  date: Date
  location: string
  locationCoordinates?: Location
  description: string
  imageUrl?: string
  createdBy: {
    userId: string
    userName: string
  }
  likes: string[]
  comments: EventComment[]
  attendees: EventAttendee[]
}
