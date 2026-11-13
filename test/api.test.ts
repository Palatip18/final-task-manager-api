import 'dotenv/config';
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import express from 'express';
import { app } from '../src/app.ts';
import { errorHandler } from '../src/middlewares/error-handler.ts';
import type { User } from '@prisma/client';
import { prisma } from '../src/lib/prisma.ts';


const prefix = `exam-${Date.now()}-${process.pid}`;
const email = (name: string) => `${prefix}-${name}@example.com`;
const credentials = (name: string) => ({ name, email: email(name), password: 'practice123' });
type PublicUser = Omit<User, 'password' | 'createdAt'> & { createdAt: string };
let alice: PublicUser, bob: PublicUser, tokenA: string, tokenB: string, taskId: number;
type Method = 'get' | 'post' | 'patch' | 'delete';
const auth = (method: Method, path: string, token: string = tokenA) => request(app)[method](path).set('Authorization', `Bearer ${token}`);
after(async () => {
  const users = await prisma.user.findMany({ where: { email: { startsWith: prefix } }, select: { id: true } });
  const ids = users.map((user) => user.id);
  await prisma.task.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
});

test('register validates input and returns only public fields, storing a hash', async () => {
  for (const body of [{}, { ...credentials('Alice'), name: ' ' }, { ...credentials('Alice'), email: 'a@b' }, { ...credentials('Alice'), password: '1234567' }]) {
    await request(app).post('/auth/register').send(body).expect(400);
  }
  const res = await request(app).post('/auth/register').send(credentials('Alice')).expect(201);
  alice = res.body;
  assert.deepEqual(Object.keys(alice).sort(), ['createdAt', 'email', 'id', 'name']);
  assert.ok(!Number.isNaN(Date.parse(alice.createdAt)));
  const stored = await prisma.user.findUnique({ where: { id: alice.id } });
  assert.ok(stored);
  assert.notEqual(stored.password, 'practice123');
  assert.ok(await bcrypt.compare('practice123', stored.password));
  await request(app).post('/auth/register').send(credentials('Alice')).expect(409);
  bob = (await request(app).post('/auth/register').send(credentials('Bob')).expect(201)).body;
});

test('login validates presence, hides which credential was wrong, issues expiring JWT', async () => {
  for (const body of [{}, { email: 123, password: 'x' }, { email: ' ', password: 'x' }]) {
    await request(app).post('/auth/login').send(body).expect(400);
  }
  const wrongPass = await request(app).post('/auth/login').send({ email: alice.email, password: 'x' }).expect(401);
  const wrongEmail = await request(app).post('/auth/login').send({ email: 'not-an-email', password: 'x' }).expect(401);
  assert.deepEqual(wrongPass.body, wrongEmail.body);
  for (const [name, id] of ([['Alice', alice.id], ['Bob', bob.id]] as const)) {
    const res = await request(app).post('/auth/login').send(credentials(name)).expect(200);
    assert.equal(res.body.tokenType, 'Bearer');
    assert.deepEqual(Object.keys(res.body).sort(), ['accessToken', 'tokenType']);
    const payload = jwt.verify(res.body.accessToken, process.env.JWT_SECRET!);
    assert.ok(typeof payload !== 'string');
    assert.ok(typeof payload.exp === 'number' && typeof payload.iat === 'number');
    assert.equal(payload.userId, id);
    assert.ok(payload.exp > payload.iat);
    if (name === 'Alice') tokenA = res.body.accessToken;
    else tokenB = res.body.accessToken;
  }
});

test('all protected endpoints authenticate before checking ID or malformed JSON', async () => {
  for (const [method, path] of ([['get', '/auth/me'], ['get', '/tasks'], ['post', '/tasks'], ['get', '/tasks/abc'], ['patch', '/tasks/abc'], ['delete', '/tasks/abc']] as const)) {
    await request(app)[method](path).expect(401);
  }
  await request(app).post('/tasks').set('Content-Type', 'application/json').send('{broken').expect(401);
  await auth('patch', '/tasks/abc').set('Content-Type', 'application/json').send('{broken').expect(400, { message: 'Invalid task ID' });
  const badTokens = ['broken', jwt.sign({}, process.env.JWT_SECRET!), jwt.sign({ userId: '1' }, process.env.JWT_SECRET!), jwt.sign({ userId: alice.id }, process.env.JWT_SECRET!), jwt.sign({ userId: alice.id }, 'wrong-secret', { expiresIn: '1h' }), jwt.sign({ userId: alice.id }, process.env.JWT_SECRET!, { expiresIn: -1 })];
  for (const token of badTokens) await auth('get', '/tasks', token).expect(401);
  assert.deepEqual((await auth('get', '/auth/me').expect(200)).body, alice);
  const missing = jwt.sign({ userId: 2147483647 }, process.env.JWT_SECRET!, { expiresIn: '1h' });
  await auth('get', '/auth/me', missing).expect(404, { message: 'User not found' });
});

test('task create enforces contract and ignores forged ownership and generated fields', async () => {
  assert.deepEqual((await auth('get', '/tasks').expect(200)).body, []);
  for (const body of [{}, { title: 5 }, { title: ' ' }, { title: 'Read', status: 'done' }, { title: 'Read', status: null }, { title: 'Read', description: 5 }, null, []]) {
    await auth('post', '/tasks').set('Content-Type', 'application/json').send(JSON.stringify(body)).expect(400);
  }
  const res = await auth('post', '/tasks').send({ title: 'Learn Express.js', userId: bob.id, id: 99999, createdAt: '2000-01-01', extra: true }).expect(201);
  taskId = res.body.id;
  assert.equal(res.body.userId, alice.id);
  assert.equal(res.body.status, 'PENDING');
  assert.equal(res.body.description, null);
  assert.deepEqual(Object.keys(res.body).sort(), ['createdAt', 'description', 'id', 'status', 'title', 'userId']);
  assert.notEqual(res.body.createdAt, '2000-01-01');
  assert.deepEqual((await auth('get', `/tasks/${taskId}`).expect(200)).body, res.body);
});

test('list is a newest-first array isolated per user', async () => {
  const second = (await auth('post', '/tasks').send({ title: 'Second', description: 'Notes', status: 'IN_PROGRESS' }).expect(201)).body;
  const list = (await auth('get', '/tasks').expect(200)).body;
  assert.equal(list[0].id, second.id);
  assert.ok(list.every((task: { userId: number }) => task.userId === alice.id));
  assert.deepEqual((await auth('get', '/tasks', tokenB).expect(200)).body, []);
});

test('invalid IDs fail before body and ownership; partial updates preserve omitted fields', async () => {
  for (const id of ['abc', '0', '-1', '1.5', '1abc', '99999999999999999999']) {
    for (const method of (['get', 'patch', 'delete'] as const)) await auth(method, `/tasks/${id}`).send({ status: 'DONE' }).expect(400);
  }
  for (const body of [{}, { userId: bob.id, id: 1 }, { title: null }, { description: false }, { status: 'done' }]) {
    await auth('patch', `/tasks/${taskId}`).send(body).expect(400);
    await auth('patch', '/tasks/2147483647').send(body).expect(400);
  }
  const updated = (await auth('patch', `/tasks/${taskId}`).send({ status: 'DONE', userId: bob.id }).expect(200)).body;
  assert.equal(updated.title, 'Learn Express.js');
  assert.equal(updated.status, 'DONE');
  assert.equal(updated.userId, alice.id);
  await auth('patch', `/tasks/${taskId}`).send({ description: 'Details' }).expect(200);
  assert.equal((await auth('patch', `/tasks/${taskId}`).send({ description: null }).expect(200)).body.description, null);
});

test('another user cannot read, change or delete a task; responses match nonexistent task', async () => {
  const before = (await auth('get', `/tasks/${taskId}`)).body;
  for (const method of (['get', 'patch', 'delete'] as const)) {
    const foreign = await auth(method, `/tasks/${taskId}`, tokenB).send({ title: 'Hacked' }).expect(404);
    const absent = await auth(method, '/tasks/2147483647', tokenB).send({ title: 'Hacked' }).expect(404);
    assert.deepEqual(foreign.body, absent.body);
  }
  assert.deepEqual((await auth('get', `/tasks/${taskId}`).expect(200)).body, before);
});

test('delete returns empty 204 and repeat access returns 404', async () => {
  const res = await auth('delete', `/tasks/${taskId}`).expect(204);
  assert.equal(res.text, '');
  await auth('delete', `/tasks/${taskId}`).expect(404);
  await auth('get', `/tasks/${taskId}`).expect(404);
});

test('malformed JSON, unknown routes and unexpected DB errors return safe JSON', async () => {
  await auth('post', '/tasks').set('Content-Type', 'application/json').send('{broken').expect(400);
  await request(app).get('/missing').expect(401);
  await auth('get', '/missing').expect(404, { message: 'Route not found' });
  const failingApp = express();
  failingApp.get('/failure', () => { throw new Error('Internal DB details must stay private'); });
  failingApp.use(errorHandler);
  await request(failingApp).get('/failure').expect(500, { message: 'Internal server error' });
});

test('concurrent duplicate registrations return one 201 and one 409', async () => {
  const body = credentials('Race');
  const responses = await Promise.all([
    request(app).post('/auth/register').send(body),
    request(app).post('/auth/register').send(body),
  ]);
  assert.deepEqual(responses.map((response) => response.status).sort(), [201, 409]);
  const conflict = responses.find((response) => response.status === 409);
  assert.ok(conflict);
  assert.deepEqual(conflict.body, { message: 'Email already exists' });
});

test('validation rejects wrong field types while allowing optional empty descriptions', async () => {
  for (const badEmail of ['a@@b.com', 'a b@example.com', 'a@example', '@example.com']) {
    await request(app).post('/auth/register').send({ ...credentials('Invalid'), email: badEmail }).expect(400);
  }
  for (const body of [null, [], { ...credentials('Invalid'), name: false }, { ...credentials('Invalid'), password: 12345678 }]) {
    await request(app).post('/auth/register').set('Content-Type', 'application/json').send(JSON.stringify(body)).expect(400);
  }
  const created = (await auth('post', '/tasks').send({ title: 'Optional description', description: '' }).expect(201)).body;
  assert.equal(created.description, '');
  const updated = (await auth('patch', `/tasks/${created.id}`).send({ title: 'Renamed', description: '', status: 'DONE', createdAt: '2000-01-01', id: 999999 }).expect(200)).body;
  assert.equal(updated.id, created.id);
  assert.equal(updated.createdAt, created.createdAt);
  assert.equal(updated.title, 'Renamed');
  assert.equal(updated.status, 'DONE');
});
