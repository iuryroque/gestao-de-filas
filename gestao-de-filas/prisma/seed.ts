import { PrismaClient } from '../generated/prisma'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed dos dados administrativos (GBAC)...')

  // Hash para senha padrão "admin123"
  const defaultPassword = await bcrypt.hash("admin123", 10);

  // 1. Array de Permissões base do sistema
  const permissionsData = [
    { code: 'admin:access', description: 'Acesso total aos paineis administrativos e configurações.' },
    { code: 'users:manage', description: 'Pode convidar, remover ou alterar o grupo de usuários.' },
    { code: 'groups:manage', description: 'Pode criar grupos e atribuir permissões.' },
    { code: 'queues:manage', description: 'Pode configurar regras de SLA, TMA e criar Filas.' },
    { code: 'desks:manage', description: 'Pode cadastrar, bloquear ou remover Guichês operacionais.' },
    { code: 'tickets:call', description: 'Permissão para usar o painel do Guichê (chamar senhas, etc).' },
    { code: 'tickets:transfer', description: 'Permissão para transferir tickets entre filas.' },
    { code: 'reports:view', description: 'Pode acessar a área de relatórios analíticos.' },
  ]

  // Upsert de permissoes no banco (cria se não existe, atualiza se existe)
  const permissions = []
  for (const p of permissionsData) {
    const perm = await prisma.permission.upsert({
      where: { code: p.code },
      update: { description: p.description },
      create: p,
    })
    permissions.push(perm)
  }
  console.log('✅ Permissões criadas/atualizadas com sucesso.')

  // 2. Criar os Grupos básicos e atrelar permissões

  // -- GRUPO ADMIN (Todas as permissões)
  const adminGroup = await prisma.group.upsert({
    where: { name: 'Administradores' },
    update: {},
    create: {
      name: 'Administradores',
      description: 'Acesso total e irrestrito ao sistema.',
      permissions: {
        create: permissions.map(p => ({
          permission: { connect: { id: p.id } }
        }))
      }
    }
  })

  // Se o grupo Admin já existia, garantir que ele tem TODAS as permissões recém criadas se teve alguma nova adicionada (limpa e recria as pontes)
  await prisma.groupPermission.deleteMany({
    where: { groupId: adminGroup.id }
  })
  await prisma.groupPermission.createMany({
    data: permissions.map(p => ({
      groupId: adminGroup.id,
      permissionId: p.id
    }))
  })

  // -- GRUPO SUPERVISORES
  const supervisorPermissions = permissions.filter(p => 
    ['queues:manage', 'desks:manage', 'tickets:call', 'tickets:transfer', 'reports:view'].includes(p.code)
  )
  const supervisorGroup = await prisma.group.upsert({
    where: { name: 'Supervisores' },
    update: {},
    create: {
      name: 'Supervisores',
      description: 'Responsáveis por monitorar a operação, abrir guichês e gerar relatórios.',
      permissions: {
        create: supervisorPermissions.map(p => ({
          permission: { connect: { id: p.id } }
        }))
      }
    }
  })

  // -- GRUPO OPERAÇÃO (Atendentes base)
  const operatorPermissions = permissions.filter(p => 
    ['tickets:call', 'tickets:transfer'].includes(p.code)
  )
  const operatorGroup = await prisma.group.upsert({
    where: { name: 'Atendentes' },
    update: {},
    create: {
      name: 'Atendentes',
      description: 'Operadores de linha de frente nas mesas e guichês.',
      permissions: {
        create: operatorPermissions.map(p => ({
          permission: { connect: { id: p.id } }
        }))
      }
    }
  })
  
  console.log('✅ Grupos mestres gerados com sucesso.')

  // 3. Vincular usuários existentes (Legacy) ao grupo de Atendentes por padrão, ou Admin caso seja o primeiro usuário e esteja sem grupo
  const users = await prisma.user.findMany()
  
  for (const user of users) {
    const username = user.username || (user.email ? user.email.split('@')[0] : `user${user.id.slice(-4)}`);
    const updateData: any = {
      username: username,
      password: user.password || defaultPassword
    };

    if (!user.groupId) {
      if (user.role === 'admin') {
         updateData.groupId = adminGroup.id;
      } else if (user.role === 'supervisor') {
         updateData.groupId = supervisorGroup.id;
      } else {
         updateData.groupId = operatorGroup.id;
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: updateData
    });
    
    console.log(`👤 Usuário [${user.email || user.name}] atualizado com username: [${username}].`)
  }

  // Criar um Admin padrão se a lista estiver vazia
  if (users.length === 0) {
     await prisma.user.create({
       data: {
         name: 'Administrador do Sistema',
         email: 'admin@siga.gov.br',
         username: 'admin',
         password: defaultPassword,
         groupId: adminGroup.id,
         role: 'admin'
       }
     });
     console.log('👤 Usuário [admin] criado com senha [admin123].');
  }

  console.log('🏁 Seed de acessos finalizado com sucesso.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
