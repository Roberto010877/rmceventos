import { Request, Response, NextFunction } from 'express';
import sanitizeHtml from 'sanitize-html';

/**
 * Limpia un valor, eliminando todas las etiquetas HTML y espacios en blanco al inicio/final.
 * Funciona de forma recursiva para objetos y arreglos.
 */
const cleanValue = (val: any): any => {
  if (typeof val === 'string') {
    return sanitizeHtml(val, {
      allowedTags: [],
      allowedAttributes: {}
    }).trim();
  }
  if (Array.isArray(val)) {
    return val.map(cleanValue);
  }
  if (val !== null && typeof val === 'object') {
    const cleanedObj: any = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        cleanedObj[key] = cleanValue(val[key]);
      }
    }
    return cleanedObj;
  }
  return val;
};

/**
 * Middleware para sanitizar campos del req.body contra inyecciones HTML/Scripts.
 * @param fields Nombres de los campos a sanitizar (soporta anidamiento con puntos, ej. 'usuario.nombre').
 *               Si no se especifican campos, sanitiza todo el body.
 */
export const sanitizeBody = (...fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.body) {
      next();
      return;
    }

    if (fields.length === 0) {
      req.body = cleanValue(req.body);
    } else {
      fields.forEach(field => {
        const keys = field.split('.');
        let current = req.body;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (current === null || typeof current !== 'object' || current[keys[i]] === undefined) {
            return;
          }
          current = current[keys[i]];
        }
        
        const lastKey = keys[keys.length - 1];
        if (current !== null && typeof current === 'object' && current[lastKey] !== undefined) {
          current[lastKey] = cleanValue(current[lastKey]);
        }
      });
    }
    
    next();
  };
};
