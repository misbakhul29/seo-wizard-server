import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Upsert default author
  const defaultAuthor = await prisma.author.upsert({
    where: { name: 'Misbakhul Munir' },
    update: {},
    create: {
      name: 'Misbakhul Munir',
    },
  });

  // Update all articles yang belum punya authorId
  await prisma.article.updateMany({
    where: { authorId: undefined },
    data: { authorId: defaultAuthor.id },
  });

  console.log('Seeding selesai. Author default:', defaultAuthor);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
