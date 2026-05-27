import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { Roles } from '../common/roles';
import { UserEntity } from '../users/user.entity';

const DEFAULT_ADMIN = {
  email: 'admin@eco.test',
  username: 'admin',
  fullName: 'ECO System Admin',
  phone: '0900000000',
  password: 'Admin@123456',
};

const getEnv = (key: string, fallback: string) => process.env[key]?.trim() || fallback;

async function createAdmin() {
  const email = getEnv('ADMIN_EMAIL', DEFAULT_ADMIN.email).toLowerCase();
  const username = getEnv('ADMIN_USERNAME', DEFAULT_ADMIN.username);
  const fullName = getEnv('ADMIN_FULL_NAME', DEFAULT_ADMIN.fullName);
  const phone = getEnv('ADMIN_PHONE', DEFAULT_ADMIN.phone);
  const password = getEnv('ADMIN_PASSWORD', DEFAULT_ADMIN.password);
  const hubId = process.env.ADMIN_HUB_ID?.trim() || null;

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters.');
  }

  await dataSource.initialize();

  try {
    const usersRepository = dataSource.getRepository(UserEntity);
    const existingUser = await usersRepository.findOne({
      where: [{ email }, { username }],
    });
    const password_hash = await bcrypt.hash(password, 10);

    if (existingUser) {
      existingUser.email = email;
      existingUser.username = username;
      existingUser.full_name = fullName;
      existingUser.phone = phone;
      existingUser.password_hash = password_hash;
      existingUser.role_mask = Roles.DIRECTOR;
      existingUser.hub_id = hubId;
      existingUser.is_active = true;
      existingUser.refresh_token = null;
      await usersRepository.save(existingUser);

      console.log(`Updated admin account: ${email} (${username})`);
      return;
    }

    const admin = usersRepository.create({
      email,
      username,
      full_name: fullName,
      phone,
      password_hash,
      role_mask: Roles.DIRECTOR,
      hub_id: hubId,
      is_active: true,
      refresh_token: null,
      last_login_at: null,
    });

    await usersRepository.save(admin);
    console.log(`Created admin account: ${email} (${username})`);
  } finally {
    await dataSource.destroy();
  }
}

createAdmin().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
