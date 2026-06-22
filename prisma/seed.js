const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const adminEmail = process.env.ADMIN_EMAIL;

async function main() {
  if (!adminEmail) {
    console.log('ADMIN_EMAIL não definido. Nenhum administrador foi promovido.');
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!user) {
    console.log(`Usuário com e-mail "${adminEmail}" não encontrado.`);
    return;
  }

  if (user.role === 'admin') {
    console.log(`Usuário "${user.email}" já é administrador.`);
    return;
  }

  await prisma.user.update({
    where: { email: adminEmail },
    data: { role: 'admin' }
  });

  console.log(`Usuário "${user.email}" promovido a administrador com sucesso.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
