import morgan from 'morgan';
import { apiLogger } from '@/utils/logger.ts';

const morganFormat = ':method :url :status :res[content-length] - :response-time ms';

// Crea un middleware de Morgan que use el apiLogger
const morganMiddleware = morgan(morganFormat, {
    stream: {
        write: (message: string) => {
            const statusCode = Number.parseInt(message.split(' ')[2], 10); // Extrae el código de estado del mensaje

            if (statusCode >= 500) {
                apiLogger.error(message.trim());
            } else if (statusCode >= 400) {
                apiLogger.warn(message.trim());
            } else {
                apiLogger.info(message.trim());
            }
        },
    },
});

export default morganMiddleware;