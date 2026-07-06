import { calendar_v3 } from 'googleapis'
import dayjs from 'dayjs'
import Schema$Event = calendar_v3.Schema$Event

import isBetween from 'dayjs/plugin/isBetween'

dayjs.extend(isBetween)

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']

function getDayFromWeek(currentDate: Date) {
  return daysOfWeek[currentDate.getDay()]
}

interface EventDate {
  name: string | undefined | null
  start: Date
  end: Date
}

type EventsDayByDay = {
  [key: number]: Array<EventDate>
}

function parseEventDate(event: calendar_v3.Schema$Event, today: Date): EventDate {
  const eventStartDate = new Date(event?.start?.dateTime!)
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    eventStartDate.getHours(),
    eventStartDate.getMinutes()
  )

  const eventEndDate = new Date(event.end?.dateTime!)
  const end = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    eventEndDate.getHours(),
    eventEndDate.getMinutes()
  )
  return {
    name: event.summary,
    start,
    end,
  }
}

function parseEventWholeDay(today: Date): EventDate {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0)
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59)
  return {
    name: 'Whole day',
    start,
    end,
  }
}

export function createEventsDayByDay(timeMin: Date, timeMax: Date, events: Array<Schema$Event> = []): EventsDayByDay {
  let ret: EventsDayByDay = {}
  const month = timeMin.getMonth()
  const year = timeMin.getFullYear()

  for (let currentDay = timeMin.getDate(); currentDay <= timeMax.getDate(); currentDay += 1) {
    const currentDate = new Date(year, month, currentDay)
    ret = { ...ret, [currentDay]: [] }
    events.forEach((event) => {
      if (event.recurrence && event.recurrence.length > 0) {
        if (event.recurrence[0].includes('DAILY')) {
          ret[currentDay].push(parseEventDate(event, currentDate))
        }
        if (
          event.recurrence[0].includes('WEEKLY') &&
          event.recurrence[0].split('BYDAY=')[1].includes(getDayFromWeek(currentDate))
        ) {
          if (event.start?.date) {
            ret[currentDay].push(parseEventWholeDay(currentDate))
          } else {
            ret[currentDay].push(parseEventDate(event, currentDate))
          }
        }
      }

      if (
        !event.recurrence &&
        event.start &&
        event.start.dateTime &&
        dayjs(event.start?.dateTime).isSame(currentDate, 'day')
      ) {
        ret[currentDay].push(parseEventDate(event, currentDate))
      }

      // whole day
      if (!event.recurrence && event.start?.date) {
        const startDate = new Date(event.start?.date)
        // @ts-ignore
        const endDate = new Date(event.end?.date)
        if (dayjs(currentDate).isBetween(dayjs(startDate), dayjs(endDate), 'day', '[)')) {
          ret[currentDay].push(parseEventWholeDay(currentDate))
        }
      }
    })
  }
  return ret
}

const interval = 15 // Minutes
function padTo2Digits(num: number) {
  return String(num).padStart(2, '0')
}

export function getHoursAndMinutes(date: Date) {
  return `${padTo2Digits(date.getHours())}:${padTo2Digits(date.getMinutes())}`
}

function createAvailableSlots(
  timeMin: Date,
  day: number,
  events: Array<EventDate>,
  meetingDuration = 60
): Array<string> {
  const availableSlots = []

  let currentSlotStart = new Date(timeMin.getFullYear(), timeMin.getMonth(), day, 6, 0)
  if (dayjs(currentSlotStart).isSame(timeMin, 'day')) {
    currentSlotStart.setHours(timeMin.getHours() + 1)
    currentSlotStart.setMinutes(0)
  }
  const workdayEnd = new Date(timeMin.getFullYear(), timeMin.getMonth(), day, 23, 0)
  while (currentSlotStart < workdayEnd) {
    const currentSlotEnd = new Date(currentSlotStart)
    currentSlotEnd.setMinutes(currentSlotEnd.getMinutes() + meetingDuration)

    if (
      events.every((event) => {
        return (currentSlotStart < event.start && currentSlotEnd <= event.start) || currentSlotStart >= event.end
      })
    ) {
      availableSlots.push(getHoursAndMinutes(currentSlotStart))
    }

    currentSlotStart = new Date(currentSlotStart)
    currentSlotStart.setMinutes(currentSlotStart.getMinutes() + interval)
  }

  return availableSlots
}

type AvailableSlotsDayByDay = {
  [key: number]: Array<string>
}

export function createAvailableSlotsDayByDay(
  timeMin: Date,
  events: EventsDayByDay,
  duration: number
): AvailableSlotsDayByDay {
  return Object.entries(events).reduce((acc, [day, eventsPerDay]) => {
    return {
      ...acc,
      [day]: createAvailableSlots(timeMin, parseInt(day, 10), eventsPerDay, duration),
    }
  }, {})
}

export function isSameDay(date1: Date, date2: Date) {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function parseDate(date: Date): string {
  return `${date.getDate()}-${date.getMonth()}-${date.getFullYear()}`
}
