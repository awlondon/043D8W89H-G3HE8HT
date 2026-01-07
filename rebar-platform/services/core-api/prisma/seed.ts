import { ensureSeedData } from '../src/data/data-store';
import { seedData } from '../src/data/seed-data';

async function main() {
  await ensureSeedData(seedData);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    // Prisma client is managed inside ensureSeedData.
    process.exit(0);
  });
