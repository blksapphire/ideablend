const { PrismaClient } = require('@prisma/client');

// single shared instance across the app instead of `new PrismaClient()`
// in every route file
const prisma = new PrismaClient();

module.exports = prisma;
