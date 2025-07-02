/**
 * Clase para estandarizar respuestas de la API
 */
class ApiResponse {
  /**
   * Crear una respuesta exitosa
   * @param {Object} res - Objeto de respuesta Express
   * @param {String} message - Mensaje descriptivo
   * @param {*} data - Datos a devolver
   * @param {Number} statusCode - Código HTTP (default: 200)
   */
  static success(res, message = "Operación exitosa", data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  }

  /**
   * Crear una respuesta de error
   * @param {Object} res - Objeto de respuesta Express
   * @param {String} message - Mensaje de error
   * @param {Number} statusCode - Código HTTP (default: 400)
   * @param {*} errors - Detalles adicionales del error
   */
  static error(res, message = "Ha ocurrido un error", statusCode = 400, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors
    });
  }

  /**
   * Respuesta para registro exitoso
   */
  static created(res, message = "Recurso creado exitosamente", data = null) {
    return this.success(res, message, data, 201);
  }

  /**
   * Respuesta para no encontrado
   */
  static notFound(res, message = "Recurso no encontrado") {
    return this.error(res, message, 404);
  }

  /**
   * Respuesta para error no autorizado
   */
  static unauthorized(res, message = "No autorizado") {
    return this.error(res, message, 401);
  }

  /**
   * Respuesta para error de validación
   */
  static badRequest(res, message = "Datos inválidos", errors = null) {
    return this.error(res, message, 400, errors);
  }

  /**
   * Respuesta para error interno del servidor
   */
  static serverError(res, message = "Error interno del servidor", errors = null) {
    return this.error(res, message, 500, errors);
  }
}

module.exports = ApiResponse; 