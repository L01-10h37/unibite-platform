/**
 * User Model
 * Define your database schema here
 * This is a placeholder for MongoDB/Mongoose or any other ORM
 */

export class User {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.avatar = data.avatar;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Add validation methods here
  static validate(data) {
    const errors = {};

    if (!data.name) {
      errors.name = 'Name is required';
    }

    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!this.isValidEmail(data.email)) {
      errors.email = 'Email is invalid';
    }

    return Object.keys(errors).length === 0 ? null : errors;
  }

  static isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
}

export default User;
