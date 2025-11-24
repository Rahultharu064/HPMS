import prisma from './src/config/client.js';

async function seedExtraServices() {
  try {
    console.log('Starting to seed extra services data...');

    // Create categories if they don't exist
    const allCategories = await prisma.serviceCategory.findMany();
    console.log(`Found ${allCategories.length} existing categories`);

    const categoryNames = ['Food & Beverage', 'Transportation', 'Entertainment'];
    const categoriesToCreate = categoryNames.filter(name =>
      !allCategories.find(cat => cat.name === name)
    );

    if (categoriesToCreate.length > 0) {
      console.log('Creating missing categories:', categoriesToCreate);

      const newCategories = await Promise.all(
        categoriesToCreate.map(name => {
          let description = '';
          if (name === 'Food & Beverage') description = 'Food and drink services';
          else if (name === 'Transportation') description = 'Transportation and transfer services';
          else if (name === 'Entertainment') description = 'Entertainment and leisure services';

          return prisma.serviceCategory.create({
            data: { name, description }
          });
        })
      );

      console.log('Created categories:', newCategories.map(c => c.name));
      allCategories.push(...newCategories);
    } else {
      console.log('All categories already exist');
    }

    // Create services for new categories or if no services exist at all
    const existingServices = await prisma.extraService.count();
    console.log(`Found ${existingServices} existing extra services`);

    // Always create services for categories that don't have any services yet
    const categoriesWithNoServices = allCategories.filter(async cat => {
      const serviceCount = await prisma.extraService.count({ where: { categoryId: cat.id } });
      return serviceCount === 0;
    });

    const categoriesWithNoServicesSync = [];
    for (const cat of allCategories) {
      const serviceCount = await prisma.extraService.count({ where: { categoryId: cat.id } });
      if (serviceCount === 0) {
        categoriesWithNoServicesSync.push(cat);
      }
    }

    if (existingServices === 0 || categoriesWithNoServicesSync.length > 0) {
      console.log('Creating extra services...');

      const services = [];

      // Food & beverage services
      const foodCategory = allCategories.find(c => c.name === 'Food & Beverage');
      if (foodCategory) {
        await Promise.all([
          prisma.extraService.create({
            data: {
              name: 'Nepali Momo (Chicken)',
              description: 'Traditional Nepali dumplings filled with spiced minced chicken',
              price: 250,
              categoryId: foodCategory.id
            }
          }),
          prisma.extraService.create({
            data: {
              name: 'Buff Momo (Buff)',
              description: 'Traditional Nepali dumplings filled with spiced minced buffalo',
              price: 200,
              categoryId: foodCategory.id
            }
          }),
          prisma.extraService.create({
            data: {
              name: 'Dal Bhat',
              description: 'Traditional Nepali meal with lentil soup and rice',
              price: 300,
              categoryId: foodCategory.id
            }
          }),
          prisma.extraService.create({
            data: {
              name: 'Nepali Tea',
              description: 'Traditional black tea with spices',
              price: 100,
              categoryId: foodCategory.id
            }
          }),
          prisma.extraService.create({
            data: {
              name: 'Coffee',
              description: 'Freshly brewed coffee',
              price: 150,
              categoryId: foodCategory.id
            }
          })
        ]);
      }

      // Transportation services
      const transportCategory = allCategories.find(c => c.name === 'Transportation');
      if (transportCategory) {
        await Promise.all([
          prisma.extraService.create({
            data: {
              name: 'Airport Transfer (Tribhuvan Airport)',
              description: 'One-way transfer to/from Tribhuvan International Airport',
              price: 2000,
              categoryId: transportCategory.id
            }
          }),
          prisma.extraService.create({
            data: {
              name: 'Bus Station Transfer (City)',
              description: 'Transfer to/from city bus station',
              price: 800,
              categoryId: transportCategory.id
            }
          }),
          prisma.extraService.create({
            data: {
              name: 'Sightseeing Tour (Kathmandu)',
              description: 'Guided sightseeing tour of Kathmandu valley',
              price: 4500,
              categoryId: transportCategory.id
            }
          })
        ]);
      }

      // Entertainment services
      const entertainmentCategory = allCategories.find(c => c.name === 'Entertainment');
      if (entertainmentCategory) {
        await Promise.all([
          prisma.extraService.create({
            data: {
              name: 'Bhaktapur Day Trip',
              description: 'Full day guided tour of ancient Bhaktapur city',
              price: 3500,
              categoryId: entertainmentCategory.id
            }
          }),
          prisma.extraService.create({
            data: {
              name: 'Cultural Dance Show',
              description: 'Traditional Nepali cultural dance performance',
              price: 2000,
              categoryId: entertainmentCategory.id
            }
          }),
          prisma.extraService.create({
            data: {
              name: 'Everest Helicopter Tour',
              description: 'Helicopter tour to see Mount Everest up close',
              price: 25000,
              categoryId: entertainmentCategory.id
            }
          })
        ]);
      }

      console.log('Extra services created successfully');
    }

    console.log('Seeding completed successfully!');

    // Query and show results
    const finalCategories = await prisma.serviceCategory.findMany({
      include: { _count: { select: { extraServices: true } } }
    });

    const finalServices = await prisma.extraService.findMany({
      include: { category: true }
    });

    console.log('\nFinal data:');
    console.log('Total categories:', finalCategories.length);
    console.log('Total services:', finalServices.length);
    console.log('Services by category:');
    finalCategories.forEach(cat => {
      console.log(`  ${cat.name}: ${cat._count.extraServices} services`);
    });

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedExtraServices();
