/**
 * Utilidad para validación de datos
 */
class Validator {
  /**
   * Validar que todos los campos requeridos estén presentes
   * @param {Object} body - Objeto a validar
   * @param {Array} requiredFields - Array de campos requeridos
   * @returns {Object} - Resultado de validación: {isValid, errors}
   */
  static validateRequired(body, requiredFields) {
    const errors = [];
    const missingFields = [];

    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      errors.push(`Campos requeridos faltantes: ${missingFields.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validar que un email tenga formato correcto
   * @param {String} email - Email a validar
   * @returns {Boolean} - true si es válido
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar formato de una fecha (YYYY-MM-DD)
   * @param {String} date - Fecha a validar
   * @returns {Boolean} - true si es válido
   */
  static isValidDate(date) {
    if (!date) return false;
    
    // Verificar formato YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    // Verificar que la fecha sea válida
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  }

  /**
   * Validar que un valor sea numérico
   * @param {*} value - Valor a validar
   * @returns {Boolean} - true si es un número válido
   */
  static isValidNumber(value) {
    if (value === null || value === undefined || value === '') return false;
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  /**
   * Validar que un valor esté dentro de un rango
   * @param {Number} value - Valor a validar
   * @param {Number} min - Valor mínimo
   * @param {Number} max - Valor máximo
   * @returns {Boolean} - true si está en el rango
   */
  static isInRange(value, min, max) {
    if (!this.isValidNumber(value)) return false;
    const numValue = parseFloat(value);
    return numValue >= min && numValue <= max;
  }

  /**
   * Validar longitud de una cadena
   * @param {String} str - Cadena a validar
   * @param {Number} minLength - Longitud mínima
   * @param {Number} maxLength - Longitud máxima
   * @returns {Boolean} - true si la longitud es válida
   */
  static isValidLength(str, minLength, maxLength) {
    if (typeof str !== 'string') return false;
    return str.length >= minLength && str.length <= maxLength;
  }
}

module.exports = Validator; 