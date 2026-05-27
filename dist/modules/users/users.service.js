"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = createUser;
exports.listUsers = listUsers;
exports.updateUser = updateUser;
exports.getMe = getMe;
exports.updateMe = updateMe;
exports.updateMyPassword = updateMyPassword;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = require("../../config/prisma");
const imageUpload_1 = require("../../utils/imageUpload");
const userSelect = {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true,
    lastName: true,
    maternalLastName: true,
    birthDate: true,
    phone: true,
    whatsapp: true,
    avatarUrl: true,
    createdAt: true,
};
async function createUser(params) {
    const { name, email, password, role, lastName, maternalLastName, birthDate, phone, whatsapp, isActive, avatarBase64, avatarMimeType, baseUrl } = params;
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing)
        throw new Error("EMAIL_ALREADY_EXISTS");
    const passwordHash = await bcrypt_1.default.hash(password, 10);
    const avatarUrl = await (0, imageUpload_1.saveBase64Image)({ base64: avatarBase64, mimeType: avatarMimeType, baseUrl, folder: "avatars", maxBytes: 1500000 });
    return prisma_1.prisma.user.create({
        data: {
            name,
            email: email.toLowerCase().trim(),
            passwordHash,
            role: role || "SELLER",
            lastName,
            maternalLastName,
            birthDate,
            phone,
            whatsapp,
            avatarUrl,
            isActive: isActive ?? true,
        },
        select: userSelect,
    });
}
async function listUsers() {
    return prisma_1.prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: userSelect,
    });
}
async function updateUser(id, params) {
    const { password, avatarBase64, avatarMimeType, baseUrl, ...rest } = params;
    const dataToUpdate = { ...rest };
    if (password) {
        dataToUpdate.passwordHash = await bcrypt_1.default.hash(password, 10);
    }
    const avatarUrl = await (0, imageUpload_1.saveBase64Image)({ base64: avatarBase64, mimeType: avatarMimeType, baseUrl, folder: "avatars", maxBytes: 1500000 });
    if (avatarUrl)
        dataToUpdate.avatarUrl = avatarUrl;
    return prisma_1.prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: userSelect,
    });
}
async function getMe(id) {
    return prisma_1.prisma.user.findUnique({
        where: { id },
        select: userSelect,
    });
}
async function updateMe(id, params) {
    const { avatarBase64, avatarMimeType, baseUrl, ...rest } = params;
    const avatarUrl = await (0, imageUpload_1.saveBase64Image)({ base64: avatarBase64, mimeType: avatarMimeType, baseUrl, folder: "avatars", maxBytes: 1500000 });
    const dataToUpdate = avatarUrl ? { ...rest, avatarUrl } : rest;
    return prisma_1.prisma.user.update({
        where: { id },
        data: dataToUpdate,
        select: userSelect,
    });
}
async function updateMyPassword(id, oldPass, newPass) {
    const user = await prisma_1.prisma.user.findUnique({ where: { id } });
    if (!user)
        throw new Error("USER_NOT_FOUND");
    const isValid = await bcrypt_1.default.compare(oldPass, user.passwordHash);
    if (!isValid)
        throw new Error("INVALID_OLD_PASSWORD");
    const passwordHash = await bcrypt_1.default.hash(newPass, 10);
    await prisma_1.prisma.user.update({ where: { id }, data: { passwordHash } });
}
