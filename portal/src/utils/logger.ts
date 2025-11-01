import winston from 'winston'

const LOG_LEVEL = process.env.LOG_LEVEL || 'info'
const LOG_FILE = process.env.LOG_FILE || '/data/logs/portal.log'

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'portal' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: LOG_FILE,
      format: winston.format.json(),
    }),
  ],
})

export default logger
