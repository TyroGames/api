/**
 * Controlador para gestionar los usuarios del sistema
 * @module controllers/Configuracion/userController
 */

const User = require('../../models/userModel');
const logger = require('../../utils/logger');
const bcrypt = require('bcrypt');

/**
 * Controlador para operaciones relacionadas con usuarios
 */
class UserController {
  /**
   * Obtener todos los usuarios
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getAll(req, res) {
    try {
      const users = await User.findAll();
      
      res.status(200).json({
        success: true,
        data: users,
        count: users.length,
        message: 'Usuarios obtenidos correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener usuarios: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios',
        error: error.message
      });
    }
  }

  /**
   * Obtener un usuario por ID
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getById(req, res) {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `Usuario con ID ${id} no encontrado`
        });
      }
      
      res.status(200).json({
        success: true,
        data: user,
        message: 'Usuario obtenido correctamente'
      });
    } catch (error) {
      logger.error(`Error al obtener usuario ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuario',
        error: error.message
      });
    }
  }

  /**
   * Crear un nuevo usuario
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async create(req, res) {
    try {
      const { username, password, email, full_name, role_id } = req.body;
      
      // Validar datos requeridos
      if (!username || !password || !email || !full_name || !role_id) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos (username, password, email, full_name, role_id)'
        });
      }
      
      // Verificar si el usuario ya existe
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: `El nombre de usuario '${username}' ya está en uso`
        });
      }
      
      // Verificar si el email ya existe
      const existingEmail = await User.findByEmail(email);
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: `El email '${email}' ya está en uso`
        });
      }
      
      const newUser = await User.create({ username, password, email, full_name, role_id });
      
      res.status(201).json({
        success: true,
        data: newUser,
        message: 'Usuario creado correctamente'
      });
    } catch (error) {
      logger.error(`Error al crear usuario: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al crear usuario',
        error: error.message
      });
    }
  }

  /**
   * Actualizar un usuario existente
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async update(req, res) {
    try {
      const { id } = req.params;
      const { full_name, email, is_active, role_id } = req.body;
      
      // Validar datos requeridos
      if (!full_name || !email || is_active === undefined || !role_id) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos (full_name, email, is_active, role_id)'
        });
      }
      
      // Verificar que el usuario exista
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: `Usuario con ID ${id} no encontrado`
        });
      }
      
      // Verificar si el email ya está en uso por otro usuario
      if (email !== existingUser.email) {
        const userWithEmail = await User.findByEmail(email);
        if (userWithEmail && userWithEmail.id !== parseInt(id)) {
          return res.status(400).json({
            success: false,
            message: `El email '${email}' ya está en uso por otro usuario`
          });
        }
      }
      
      const updated = await User.update(id, { full_name, email, is_active, role_id });
      
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo actualizar el usuario'
        });
      }
      
      const updatedUser = await User.findById(id);
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Usuario actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar usuario ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar usuario',
        error: error.message
      });
    }
  }

  /**
   * Cambiar el estado de un usuario (activo/inactivo)
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async changeStatus(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      
      // Validar datos requeridos
      if (is_active === undefined) {
        return res.status(400).json({
          success: false,
          message: 'El estado (is_active) es requerido'
        });
      }
      
      // Verificar que el usuario exista
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: `Usuario con ID ${id} no encontrado`
        });
      }
      
      // No permitir desactivar al usuario admin (asumiendo que es el ID 1)
      if (id === "1" && !is_active) {
        return res.status(400).json({
          success: false,
          message: 'No se puede desactivar al usuario administrador principal'
        });
      }
      
      const updated = await User.update(id, { 
        full_name: existingUser.full_name,
        email: existingUser.email,
        is_active,
        role_id: existingUser.role_id
      });
      
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo cambiar el estado del usuario'
        });
      }
      
      const statusText = is_active ? 'activado' : 'desactivado';
      
      res.status(200).json({
        success: true,
        data: { id, is_active },
        message: `Usuario ${statusText} correctamente`
      });
    } catch (error) {
      logger.error(`Error al cambiar estado del usuario ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del usuario',
        error: error.message
      });
    }
  }

  /**
   * Cambiar la contraseña de un usuario
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async changePassword(req, res) {
    try {
      const { id } = req.params;
      const { password } = req.body;
      
      // Validar datos requeridos
      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña es requerida'
        });
      }
      
      // Verificar requisitos de seguridad para la contraseña
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 6 caracteres'
        });
      }
      
      // Verificar que el usuario exista
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: `Usuario con ID ${id} no encontrado`
        });
      }
      
      const changed = await User.changePassword(id, password);
      
      if (!changed) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo cambiar la contraseña'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Contraseña cambiada correctamente'
      });
    } catch (error) {
      logger.error(`Error al cambiar contraseña del usuario ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar contraseña',
        error: error.message
      });
    }
  }

  /**
   * Obtener sesiones de un usuario
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async getSessions(req, res) {
    try {
      const { id } = req.params;
      
      // Aquí se implementaría la lógica para obtener las sesiones
      // Esto requeriría crear un método en el modelo de usuario
      
      res.status(200).json({
        success: true,
        message: 'Funcionalidad de sesiones pendiente de implementar'
      });
    } catch (error) {
      logger.error(`Error al obtener sesiones del usuario ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al obtener sesiones',
        error: error.message
      });
    }
  }

  /**
   * Invalidar todas las sesiones de un usuario
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async invalidateAllSessions(req, res) {
    try {
      const { id } = req.params;
      
      // Aquí se implementaría la lógica para invalidar las sesiones
      // Esto requeriría crear un método en el modelo de usuario
      
      res.status(200).json({
        success: true,
        message: 'Funcionalidad de invalidación de sesiones pendiente de implementar'
      });
    } catch (error) {
      logger.error(`Error al invalidar sesiones del usuario ${req.params.id}: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al invalidar sesiones',
        error: error.message
      });
    }
  }

  /**
   * Actualizar perfil del usuario actual
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async updateProfile(req, res) {
    try {
      // El ID del usuario se obtiene del token JWT que se procesa en el middleware verifyToken
      const id = req.user.id;
      const { full_name, email } = req.body;
      
      // Validar datos requeridos
      if (!full_name || !email) {
        return res.status(400).json({
          success: false,
          message: 'Nombre completo y email son requeridos'
        });
      }
      
      // Verificar que el usuario exista
      const existingUser = await User.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Verificar si el email ya está en uso por otro usuario
      if (email !== existingUser.email) {
        const userWithEmail = await User.findByEmail(email);
        if (userWithEmail && userWithEmail.id !== id) {
          return res.status(400).json({
            success: false,
            message: `El email '${email}' ya está en uso por otro usuario`
          });
        }
      }
      
      // Mantener el mismo rol y estado
      const updated = await User.update(id, { 
        full_name,
        email,
        is_active: existingUser.is_active,
        role_id: existingUser.role_id
      });
      
      if (!updated) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo actualizar el perfil'
        });
      }
      
      const updatedUser = await User.findById(id);
      
      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Perfil actualizado correctamente'
      });
    } catch (error) {
      logger.error(`Error al actualizar perfil: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar perfil',
        error: error.message
      });
    }
  }

  /**
   * Cambiar contraseña del usuario actual
   * @param {Request} req - Objeto de solicitud Express
   * @param {Response} res - Objeto de respuesta Express
   * @returns {Promise<void>}
   */
  static async updatePassword(req, res) {
    try {
      // El ID del usuario se obtiene del token JWT que se procesa en el middleware verifyToken
      const id = req.user.id;
      const { current_password, new_password } = req.body;
      
      // Validar datos requeridos
      if (!current_password || !new_password) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual y la nueva son requeridas'
        });
      }
      
      // Verificar requisitos de seguridad para la contraseña
      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 6 caracteres'
        });
      }
      
      // Verificar que la contraseña actual sea correcta
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Verificar la contraseña actual
      const isValid = await bcrypt.compare(current_password, user.password);
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña actual es incorrecta'
        });
      }
      
      // Cambiar la contraseña
      const changed = await User.changePassword(id, new_password);
      
      if (!changed) {
        return res.status(500).json({
          success: false,
          message: 'No se pudo cambiar la contraseña'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Contraseña cambiada correctamente'
      });
    } catch (error) {
      logger.error(`Error al cambiar contraseña: ${error.message}`);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar contraseña',
        error: error.message
      });
    }
  }
}

module.exports = UserController; 