// logger.ts
import { createLogger, transports, format } from 'winston';

export const logger = createLogger({
  level: 'debug', // default level
  format: format.combine(
    format.timestamp(),
    format.colorize(),
    format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    // Optional: add file transport
    // new transports.File({ filename: 'app.log' })
  ],
});
