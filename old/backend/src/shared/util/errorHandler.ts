import { Request, Response, NextFunction } from 'express'
import { ErrorWithStatus } from '../interface/ErrorWithStatus'

export const handleAsyncError = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export const sendErrorResponse = (res: Response, error: any) => {
  if (error instanceof ErrorWithStatus) {
    return res.status(error.status).json({
      error: error.msg || error.message,
      status: error.status,
    })
  }

  // Default error response
  return res.status(500).json({
    error: 'Internal server error',
    status: 500,
  })
}
