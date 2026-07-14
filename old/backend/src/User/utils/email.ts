export const getEmailWithOld = (email: string) => {
  const atIndex = email.lastIndexOf('@')
  const namePart = email.substring(0, atIndex)
  const domainPart = email.substring(atIndex)
  return `${namePart}_old${domainPart}`
}
