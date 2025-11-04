import pool from './db';

const users = [
  {
    name: 'Admin',
    email: 'admin@gmail.com',
    role: 'admin',
    password: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080',
  },
  {
    name: 'Bruno Costa',
    email: 'gestor@example.com',
    role: 'gestor',
    password: 'gestor',
    avatarUrl: 'https://picsum.photos/seed/user2/100/100',
  },
  {
    name: 'Carlos Dias',
    email: 'regional@example.com',
    role: 'regional',
    password: 'regional',
    avatarUrl: 'https://picsum.photos/seed/user3/100/100',
  },
  {
    name: 'Daniela Faria',
    email: 'visualizador@example.com',
    role: 'visualizador',
    password: 'visualizador',
    avatarUrl: 'https://picsum.photos/seed/user4/100/100',
  },
];

async function migrate() {
  for (const user of users) {
    await pool.query(
      'INSERT INTO users (name, email, role, password, avatarUrl) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
      [user.name, user.email, user.role, user.password, user.avatarUrl]
    );
    console.log(`Usuário ${user.name} migrado.`);
  }
  await pool.end();
  console.log('Migração concluída.');
}

migrate().catch(console.error);
