export enum CacheType {
  USER_PRIVILEGES = 'USER_PRIVILEGES',
}

type CacheState<T> = { [key: string]: Array<T> }
type LastDate = { [key: string]: Date }

export class CacheManager<T> {
  private type: CacheType

  private lastDate: LastDate = {}

  private items: CacheState<T> = {}

  constructor(type: CacheType) {
    this.type = type
  }

  public getItems(key: string): Array<T> | null {
    if (this.lastDate[key] != null) {
      if (this.isToday(key)) {
        return this.items[key]
      }
    }
    return null
  }

  public setItems(key: string, items: Array<T>): void {
    this.items = { ...this.items, [key]: items }
    this.lastDate = { ...this.lastDate, [key]: new Date() }
  }

  private isToday(key: string): boolean {
    const today = new Date()
    return (
      this.lastDate[key].getDate() === today.getDate() &&
      this.lastDate[key].getMonth() === today.getMonth() &&
      this.lastDate[key].getFullYear() === today.getFullYear()
    )
  }
}
