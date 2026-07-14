export class ErrorWithStatus extends Error {
  status: number

  msg: string

  code?: string

  constructor(status: number, message: string, code?: string) {
    super(message)
    this.status = status
    this.msg = message
    if (code !== undefined) {
      this.code = code
    }
  }
}
