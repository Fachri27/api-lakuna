import { prisma } from "../../config/db.js";

type CreateInput = {
  name: string;
  email: string;
  topic: string;
  orderId?: string;
  message: string;
};

/** Kode rujukan yang ditampilkan ke pengirim: 8 karakter pertama id, huruf besar. */
export function refOf(id: string): string {
  return `LKN-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export async function createSupportMessageService(input: CreateInput) {
  const row = await prisma.supportMessage.create({
    data: {
      name: input.name,
      email: input.email,
      topic: input.topic,
      orderId: input.orderId || null,
      message: input.message,
    },
    select: { id: true },
  });
  return { id: row.id, ref: refOf(row.id) };
}

export async function listSupportMessagesService(opts: { status?: string | undefined; page: number; limit: number }) {
  const where = opts.status ? { status: opts.status } : {};
  const [rows, total, unread] = await Promise.all([
    prisma.supportMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (opts.page - 1) * opts.limit,
      take: opts.limit,
    }),
    prisma.supportMessage.count({ where }),
    prisma.supportMessage.count({ where: { status: "NEW" } }),
  ]);
  return {
    items: rows.map((r) => ({ ...r, ref: refOf(r.id) })),
    total,
    unread,
    page: opts.page,
    limit: opts.limit,
  };
}

export async function updateSupportMessageStatusService(id: string, status: string) {
  try {
    const row = await prisma.supportMessage.update({ where: { id }, data: { status } });
    return { ...row, ref: refOf(row.id) };
  } catch {
    return null; // id tidak ada
  }
}
