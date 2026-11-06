export const businessToday = () => {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  const get = (name: string) => parts.find(part => part.type === name)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')}`
}
export const formatDate = (date: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
export const formatTime = (date: string) => new Intl.DateTimeFormat('id-ID', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(date)) + ' WIB'
