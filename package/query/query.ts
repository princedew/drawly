import { prisma } from "../db/lib/prisma.js";

export async function userExist(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  return user !== null;
}

export async function getUser(email: string) {
  return prisma.user.findUnique({
    where: { email },
  });
}

export async function createUser(email: string, password: string) {
  return prisma.user.create({
    data: { email, password },
  });
}

export async function createRoom(memberId: number, name: string) {
  console.log("name:", name);
  console.log("memberId:", memberId);
  const room = await prisma.room.findFirst({
    where: { name: name },
    select: { id: true },
  });
  if (room) {
    return;
  }
  return prisma.room.create({
    data: {
      name,
      members: { connect: { id: memberId } },
    },
    select: { id: true, name: true, createdAt: true },
  });
}

export async function deleteRoom(roomId: number) {
  return prisma.room.delete({
    where: { id: roomId },
  });
}

export async function joinRoom(roomId: number, memberId: number) {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true },
  });

  if (!room) {
    return null;
  }

  await prisma.user.update({
    where: { id: memberId },
    data: { room: { connect: { id: roomId } } },
  });

  return prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, name: true, createdAt: true },
  });
}

export async function leaveRoom(roomId: number, memberId: number) {
  return prisma.user.update({
    where: { id: memberId, roomId },
    data: { roomId: null },
  });
}
