import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDatabase } from './db';
import { User } from './models';

const ask = (question: string) => new Promise<string>((resolve) => {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  prompt.question(question, (answer) => {
    prompt.close();
    resolve(answer.trim());
  });
});

const askSecret = (question: string) => new Promise<string>((resolve, reject) => {
  const input = process.stdin;
  process.stdout.write(question);
  input.setRawMode?.(true);
  input.resume();
  let value = '';
  const onData = (chunk: Buffer) => {
    const key = chunk.toString('utf8');
    if (key === '\r' || key === '\n') {
      input.setRawMode?.(false);
      input.pause();
      input.removeListener('data', onData);
      process.stdout.write('\n');
      resolve(value);
    } else if (key === '\u0003') {
      input.setRawMode?.(false);
      input.pause();
      input.removeListener('data', onData);
      reject(new Error('Cancelled'));
    } else if (key === '\b' || key === '\x7f') {
      value = value.slice(0, -1);
    } else {
      value += key;
    }
  };
  input.on('data', onData);
});

const main = async () => {
  await connectDatabase();
  const email = (await ask('Account email: ')).toLowerCase();
  const newPassword = await askSecret('New password: ');
  if (!email.includes('@') || newPassword.length < 8) {
    throw new Error('Valid email and an 8-character password are required.');
  }

  const user = await User.findOneAndUpdate(
    { email, role: { $in: ['admin', 'rider', 'warehouse'] } },
    { $set: { passwordHash: await bcrypt.hash(newPassword, 12), status: 'active' } },
    { new: true },
  );
  if (!user) throw new Error('No admin or staff account was found for that email.');
  console.log(`Password updated for ${user.email}.`);
};

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });