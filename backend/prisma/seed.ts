import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  
  const passwordHash = await bcrypt.hash("12345678", 10);


  console.log(passwordHash);
}

main()