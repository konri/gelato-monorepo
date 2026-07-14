const parseDateForTimezone = (date: string | Date): Date => {
  const parsedAvailableDate = new Date(date)
  const userTimezoneOffset = parsedAvailableDate?.getTimezoneOffset() * 60000
  return new Date(parsedAvailableDate.getTime() - userTimezoneOffset)
}
