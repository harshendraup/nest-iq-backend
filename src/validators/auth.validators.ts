import { body } from 'express-validator';


export const registerSchema = [
body('name')
.isString()
.isLength({ min: 2 })
.withMessage('Name is required and must be at least 2 characters'),
body('email')
.isEmail()
.normalizeEmail()
.withMessage('Valid email required'),
body('password')
.isLength({ min: 6 })
.withMessage('Password must be at least 6 characters long'),
];


export const loginSchema = [
body('email').isEmail().withMessage('Valid email required'),
body('password').notEmpty().withMessage('Password required'),
];