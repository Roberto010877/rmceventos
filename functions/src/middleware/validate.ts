import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

/**
 * Middleware para validar el cuerpo de la solicitud usando Zod.
 * Reemplaza req.body con los datos validados (limpiando campos no definidos).
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errores = error.errors.map(err => ({
          campo: err.path.join('.') || 'general',
          mensaje: err.message
        }));
        
        res.status(400).json({
          error: 'Datos de entrada inválidos.',
          detalles: errores
        });
        return;
      }
      
      res.status(400).json({ error: 'Error de validación.' });
    }
  };
};
