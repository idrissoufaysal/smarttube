import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from './db';

/**
 * Récupère l'utilisateur courant depuis la base de données.
 * Si l'utilisateur est connecté via Clerk mais n'existe pas encore en DB,
 * il est automatiquement créé (upsert).
 * 
 * @returns L'utilisateur Prisma ou null si non connecté
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  // Vérifier si l'utilisateur existe déjà en base
  const existingUser = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (existingUser) {
    return existingUser;
  }

  // L'utilisateur n'existe pas en base → le créer depuis Clerk
  const clerkUser = await currentUser();

  if (!clerkUser) {
    return null;
  }

  const newUser = await prisma.user.create({
    data: {
      clerkId,
      email: clerkUser.emailAddresses[0]?.emailAddress ?? '',
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    },
  });

  return newUser;
}

/**
 * Version légère qui retourne juste le userId Prisma sans créer l'utilisateur.
 * Utile pour les requêtes de lecture où on veut juste filtrer.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { userId: clerkId } = await auth();

  if (!clerkId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });

  return user?.id ?? null;
}
