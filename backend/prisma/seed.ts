import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Migrate existing users that have no username yet (set username = email, split name into first/last)
  const usersWithoutUsername = await prisma.salesRep.findMany({
    where: { username: null },
  });
  for (const u of usersWithoutUsername) {
    const parts = u.name.trim().split(/\s+/);
    const firstName = parts[0] || u.name;
    const lastName = parts.slice(1).join(' ') || '';
    await prisma.salesRep.update({
      where: { id: u.id },
      data: { username: u.email ?? u.name, firstName, lastName },
    });
    console.log(`Migriert: ${u.name} → Benutzername: ${u.email ?? u.name}`);
  }

  // Create default admin if none exists
  const existing = await prisma.salesRep.findFirst({ where: { role: 'ADMIN' } });
  if (!existing) {
    await prisma.salesRep.create({
      data: {
        username: 'admin',
        firstName: 'Admin',
        lastName: 'istrator',
        name: 'Administrator',
        email: null,
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'ADMIN',
      },
    });
    console.log('Admin-Benutzer angelegt: Benutzername: admin / Passwort: admin123');
  } else {
    console.log('Admin bereits vorhanden, überspringe Seed.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
