"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
function signAccessToken(payload) {
    const options = {
        // Forzamos "any" para que TS no se pelee con los tipos exactos de la librería
        expiresIn: env_1.env.JWT_EXPIRES_IN,
    };
    return jsonwebtoken_1.default.sign(payload, env_1.env.JWT_SECRET, options);
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
}
