import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

const SELECT = { id: true, username: true, firstName: true, lastName: true, name: true, email: true, role: true, createdAt: true };

router.get('/', requireAuth, async (req, res) => {
  try {
    const reps = await prisma.salesRep.findMany({ select: SELECT, orderBy: { lastName: 'asc' } });
    res.json(reps);
  } catch {
    res.status(500).json({ message: 'Interner Serverfehler.' });
  }
});

router.post('/', requireRole('ADMIN'), async (req, res) => {
  try {
    const { username, firstName, lastName, email, password, role } = req.body;
    if (!username || !firstName || !lastName || !password || !role) {
      return res.status(400).json({ message: 'Pflichtfelder fehlen.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const rep = await prisma.salesRep.create({
      data: { username, firstName, lastName, name: `${firstName} ${lastName}`, email: email || null, passwordHash, role },
      select: SELECT,
    });
    res.status(201).json(rep);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Benutzername bereits vergeben.' });
    }
    res.status(500).json({ message: 'Interner Serverfehler.' });
  }
});

router.put('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    const { username, firstName, lastName, email, role, password } = req.body;
    const data: Record<string, unknown> = {};
    if (username) data.username = username;
    if (firstName) data.firstName = firstName;
    if (lastName) data.lastName = lastName;
    if (firstName || lastName) {
      const current = await prisma.salesRep.findUnique({ where: { id: req.params.id }, select: { firstName: true, lastName: true } });
      data.name = `${firstName ?? current?.firstName} ${lastName ?? current?.lastName}`;
    }
    if (email !== undefined) data.email = email || null;
    if (role) data.role = role;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);
    const rep = await prisma.salesRep.update({
      where: { id: req.params.id },
      data,
      select: SELECT,
    });
    res.json(rep);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Benutzername bereits vergeben.' });
    }
    res.status(500).json({ message: 'Interner Serverfehler.' });
  }
});

router.delete('/:id', requireRole('ADMIN'), async (req, res) => {
  try {
    if (req.params.id === req.session.userId) {
      return res.status(400).json({ message: 'Eigenes Konto kann nicht gelöscht werden.' });
    }
    await prisma.salesRep.delete({ where: { id: req.params.id } });
    res.json({ message: 'Benutzer gelöscht.' });
  } catch (error: any) {
    if (error.code === 'P2003' || error.code === 'P2014') {
      return res.status(409).json({ message: 'Benutzer kann nicht gelöscht werden – er hat noch Aufträge oder Aktivitäten.' });
    }
    res.status(500).json({ message: 'Interner Serverfehler.' });
  }
});

export default router;
