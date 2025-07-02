const UserModel = require('../models/userModel');
const ApiResponse = require('../utils/apiResponse');
const Validator = require('../utils/validator');
const { generateToken } = require('../middlewares/auth');

/**
 * Controlador para gestionar la autenticación
 */
class AuthController {
  /**
   * Método para iniciar sesión
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   */
  static async login(req, res) {
    try {
      const { username, password } = req.body;
      console.log(req.body);

      // Validar campos requeridos
      const validation = Validator.validateRequired(req.body, ['username', 'password']);
      if (!validation.isValid) {
        return ApiResponse.badRequest(res, 'Datos incompletos', validation.errors);
      }

      // Verificar credenciales
      const user = await UserModel.verifyCredentials(username, password);
      
      if (!user) {
        return ApiResponse.unauthorized(res, 'Credenciales inválidas');
      }

      // Generar token JWT
      const token = generateToken(user);

      return ApiResponse.success(res, 'Inicio de sesión exitoso', {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role_id: user.role_id
        },
        token
      });
    } catch (error) {
      console.error('Error en login:', error);
      return ApiResponse.serverError(res, 'Error al iniciar sesión');
    }
  }

  /**
   * Método para registrar un nuevo usuario
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   */
  static async register(req, res) {
    try {
      const { username, password, email, full_name, role_id } = req.body;

      // Validar campos requeridos
      const validation = Validator.validateRequired(req.body, [
        'username', 'password', 'email', 'full_name'
      ]);
      
      if (!validation.isValid) {
        return ApiResponse.badRequest(res, 'Datos incompletos', validation.errors);
      }

      // Validar formato de email
      if (!Validator.isValidEmail(email)) {
        return ApiResponse.badRequest(res, 'El formato del email es inválido');
      }

      // Verificar si el usuario ya existe
      const existingUser = await UserModel.findByUsername(username);
      if (existingUser) {
        return ApiResponse.badRequest(res, 'El nombre de usuario ya está en uso');
      }

      // Verificar si el email ya existe
      const existingEmail = await UserModel.findByEmail(email);
      if (existingEmail) {
        return ApiResponse.badRequest(res, 'El email ya está registrado');
      }

      // Crear usuario con rol predeterminado si no se especifica
      const userData = {
        username,
        password,
        email,
        full_name,
        role_id: role_id || 2 // 2 puede ser el rol de usuario regular
      };

      const newUser = await UserModel.create(userData);

      return ApiResponse.created(res, 'Usuario registrado exitosamente', {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        full_name: newUser.full_name
      });
    } catch (error) {
      console.error('Error en registro:', error);
      return ApiResponse.serverError(res, 'Error al registrar usuario');
    }
  }

  /**
   * Método para verificar el token actual
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   */
  static async verifyToken(req, res) {
    try {
      // El middleware auth.verifyToken ya verificó el token
      // y agregó la información del usuario a req.user
      const user = await UserModel.findById(req.user.id);
      
      if (!user) {
        return ApiResponse.unauthorized(res, 'Usuario no encontrado');
      }

      return ApiResponse.success(res, 'Token válido', {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          role_id: user.role_id
        }
      });
    } catch (error) {
      console.error('Error en verificación de token:', error);
      return ApiResponse.serverError(res, 'Error al verificar token');
    }
  }
}

module.exports = AuthController; 