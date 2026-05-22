import bcrypt from "bcrypt";
import { prisma } from "../../config/prisma";

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
  createdAt: true,
};

export async function createUser(params: any) {
  const { name, email, password, role, lastName, maternalLastName, birthDate, phone, whatsapp, isActive } = params;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (existing) throw new Error("EMAIL_ALREADY_EXISTS");

  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
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
      isActive: isActive ?? true,
    },
    select: userSelect,
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: userSelect,
  });
}

export async function updateUser(id: string, params: any) {
  const { password, ...rest } = params;
  const dataToUpdate: any = { ...rest };

  if (password) {
    dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
  }

  return prisma.user.update({
    where: { id },
    data: dataToUpdate,
    select: userSelect,
  });
}

export async function getMe(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: userSelect,
  });
}

export async function updateMe(id: string, params: any) {
  return prisma.user.update({
    where: { id },
    data: params,
    select: userSelect,
  });
}

export async function updateMyPassword(id: string, oldPass: string, newPass: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new Error("USER_NOT_FOUND");

  const isValid = await bcrypt.compare(oldPass, user.passwordHash);
  if (!isValid) throw new Error("INVALID_OLD_PASSWORD");

  const passwordHash = await bcrypt.hash(newPass, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
}
