const { pool } = require('../config/db');
const bcrypt = require('bcrypt');

class UserModel {
  /**
   * Crear un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise<Object>} - Usuario creado
   */
  static async create(userData) {
    const { username, password, email, full_name, role_id } = userData;
    
    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const query = `
      INSERT INTO users (username, password, email, full_name, role_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    const [result] = await pool.execute(query, [
      username, 
      hashedPassword, 
      email, 
      full_name, 
      role_id
    ]);
    
    const id = result.insertId;
    return { id, username, email, full_name, role_id };
  }
  
  /**
   * Encontrar usuario por ID
   * @param {Number} id - ID del usuario
   * @returns {Promise<Object|null>} - Usuario encontrado o null
   */
  static async findById(id) {
    const query = `
      SELECT id, username, email, full_name, role_id, is_active, last_login
      FROM users
      WHERE id = ?
    `;
    
    const [rows] = await pool.execute(query, [id]);
    return rows.length ? rows[0] : null;
  }
  
  /**
   * Encontrar usuario por nombre de usuario
   * @param {String} username - Nombre de usuario
   * @returns {Promise<Object|null>} - Usuario encontrado o null
   */
  static async findByUsername(username) {
    const query = `
      SELECT id, username, password, email, full_name, role_id, is_active
      FROM users
      WHERE username = ?
    `;
    
    const [rows] = await pool.execute(query, [username]);
    return rows.length ? rows[0] : null;
  }
  
  /**
   * Encontrar usuario por email
   * @param {String} email - Email del usuario
   * @returns {Promise<Object|null>} - Usuario encontrado o null
   */
  static async findByEmail(email) {
    const query = `
      SELECT id, username, email, full_name, role_id, is_active
      FROM users
      WHERE email = ?
    `;
    
    const [rows] = await pool.execute(query, [email]);
    return rows.length ? rows[0] : null;
  }
  
  /**
   * Verificar credenciales de usuario
   * @param {String} username - Nombre de usuario
   * @param {String} password - Contraseña
   * @returns {Promise<Object|null>} - Usuario verificado o null
   */
  static async verifyCredentials(username, password) {
    const user = await this.findByUsername(username);
    
    if (!user || !user.is_active) {
      return null;
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return null;
    }
    
    // Actualizar último acceso
    await this.updateLastLogin(user.id);
    
    // No devolver contraseña
    delete user.password;
    return user;
  }
  
  /**
   * Actualizar último acceso
   * @param {Number} id - ID del usuario
   * @returns {Promise<Boolean>} - true si actualizó correctamente
   */
  static async updateLastLogin(id) {
    const query = `
      UPDATE users
      SET last_login = NOW()
      WHERE id = ?
    `;
    
    const [result] = await pool.execute(query, [id]);
    return result.affectedRows > 0;
  }
  
  /**
   * Actualizar usuario
   * @param {Number} id - ID del usuario
   * @param {Object} userData - Datos a actualizar
   * @returns {Promise<Boolean>} - true si actualizó correctamente
   */
  static async update(id, userData) {
    const { full_name, email, is_active, role_id } = userData;
    
    const query = `
      UPDATE users
      SET full_name = ?, 
          email = ?, 
          is_active = ?, 
          role_id = ?,
          updated_at = NOW()
      WHERE id = ?
    `;
    
    const [result] = await pool.execute(query, [
      full_name, 
      email, 
      is_active ? 1 : 0,
      role_id, 
      id
    ]);
    
    return result.affectedRows > 0;
  }
  
  /**
   * Cambiar contraseña
   * @param {Number} id - ID del usuario
   * @param {String} newPassword - Nueva contraseña
   * @returns {Promise<Boolean>} - true si cambió correctamente
   */
  static async changePassword(id, newPassword) {
    // Encriptar contraseña
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const query = `
      UPDATE users
      SET password = ?, 
          updated_at = NOW()
      WHERE id = ?
    `;
    
    const [result] = await pool.execute(query, [hashedPassword, id]);
    return result.affectedRows > 0;
  }
  
  /**
   * Listar todos los usuarios
   * @returns {Promise<Array>} - Lista de usuarios
   */
  static async findAll() {
    const query = `
      SELECT u.id, u.username, u.email, u.full_name, r.name as role_name, 
             u.is_active, u.last_login, u.created_at
      FROM users u
      JOIN roles r ON u.role_id = r.id
      ORDER BY u.id
    `;
    
    const [rows] = await pool.execute(query);
    return rows;
  }
}

module.exports = UserModel; 