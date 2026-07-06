import { PrismaClient, Role, Language, TasteType, OrderStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (in reverse order of dependencies)
  console.log('Clearing existing data...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.courierLocation.deleteMany();
  await prisma.courierEarning.deleteMany();
  await prisma.courierSpot.deleteMany();
  await prisma.courierApplication.deleteMany();
  await prisma.courierProfile.deleteMany();
  await prisma.review.deleteMany();
  await prisma.taste.deleteMany();
  await prisma.product.deleteMany();
  await prisma.favoriteSpot.deleteMany();
  await prisma.pointTemplate.deleteMany();
  await prisma.employeeProfile.deleteMany();
  await prisma.spotAdminProfile.deleteMany();
  await prisma.spot.deleteMany();
  await prisma.city.deleteMany();
  await prisma.questCompletion.deleteMany();
  await prisma.quest.deleteMany();
  await prisma.userPrize.deleteMany();
  await prisma.prize.deleteMany();
  await prisma.pointTransaction.deleteMany();
  await prisma.pointBalance.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.referralCode.deleteMany();
  await prisma.newsComment.deleteMany();
  await prisma.newsLike.deleteMany();
  await prisma.news.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.deviceToken.deleteMany();
  await prisma.spotsAdminProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('✓ Cleared existing data\n');

  // Create Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@gelato.com',
      password: hashedPassword,
      name: 'Super Admin',
      emailVerified: true,
      roles: [Role.SUPER_ADMIN],
      language: Language.PL,
    },
  });
  console.log(`✓ Created Super Admin: ${superAdmin.email}`);

  // Create Cities
  const warsaw = await prisma.city.create({
    data: {
      name: 'Warsaw',
      nameLocal: { pl: 'Warszawa', en: 'Warsaw', ua: 'Варшава' },
      country: 'Poland',
      latitude: 52.2297,
      longitude: 21.0122,
    },
  });

  const krakow = await prisma.city.create({
    data: {
      name: 'Krakow',
      nameLocal: { pl: 'Kraków', en: 'Krakow', ua: 'Краків' },
      country: 'Poland',
      latitude: 50.0647,
      longitude: 19.945,
    },
  });

  const lviv = await prisma.city.create({
    data: {
      name: 'Lviv',
      nameLocal: { pl: 'Lwów', en: 'Lviv', ua: 'Львів' },
      country: 'Ukraine',
      latitude: 49.8397,
      longitude: 24.0297,
    },
  });

  console.log(`✓ Created 3 cities: ${warsaw.name}, ${krakow.name}, ${lviv.name}\n`);

  // Create Spots in Warsaw
  const spotWarsaw1 = await prisma.spot.create({
    data: {
      name: 'Gelato Espresso Warsaw Center',
      description: 'Premium artisan ice cream in the heart of Warsaw',
      address: 'ul. Nowy Świat 15, 00-029 Warszawa',
      cityId: warsaw.id,
      latitude: 52.2319,
      longitude: 21.0201,
      phone: '+48 22 123 45 67',
      email: 'warsaw.center@gelato.com',
      openingHours: {
        monday: '10:00-22:00',
        tuesday: '10:00-22:00',
        wednesday: '10:00-22:00',
        thursday: '10:00-22:00',
        friday: '10:00-23:00',
        saturday: '09:00-23:00',
        sunday: '09:00-22:00',
      },
      deliveryEnabled: true,
      deliveryRadiusKm: 5.0,
      deliveryFee: 10.0,
      freeDeliveryThreshold: 50.0,
      hasSeating: true,
      seatingCapacity: 20,
    },
  });

  const spotWarsaw2 = await prisma.spot.create({
    data: {
      name: 'Gelato Amber Mokotów',
      description: 'Cozy ice cream spot in Mokotów district',
      address: 'ul. Puławska 120, 02-620 Warszawa',
      cityId: warsaw.id,
      latitude: 52.1775,
      longitude: 21.0239,
      phone: '+48 22 234 56 78',
      email: 'warsaw.mokotow@gelato.com',
      openingHours: {
        monday: '11:00-21:00',
        tuesday: '11:00-21:00',
        wednesday: '11:00-21:00',
        thursday: '11:00-21:00',
        friday: '11:00-22:00',
        saturday: '10:00-22:00',
        sunday: '10:00-21:00',
      },
      deliveryEnabled: true,
      deliveryRadiusKm: 4.0,
      deliveryFee: 8.0,
      freeDeliveryThreshold: 40.0,
      hasSeating: true,
      seatingCapacity: 15,
    },
  });

  // Create Spots in Krakow
  const spotKrakow1 = await prisma.spot.create({
    data: {
      name: 'Gelato Rynek Krakow',
      description: 'Ice cream paradise on the Main Square',
      address: 'Rynek Główny 10, 31-042 Kraków',
      cityId: krakow.id,
      latitude: 50.0616,
      longitude: 19.9373,
      phone: '+48 12 345 67 89',
      email: 'krakow.rynek@gelato.com',
      openingHours: {
        monday: '09:00-22:00',
        tuesday: '09:00-22:00',
        wednesday: '09:00-22:00',
        thursday: '09:00-22:00',
        friday: '09:00-23:00',
        saturday: '09:00-23:00',
        sunday: '09:00-22:00',
      },
      deliveryEnabled: true,
      deliveryRadiusKm: 6.0,
      deliveryFee: 12.0,
      freeDeliveryThreshold: 60.0,
      hasSeating: true,
      seatingCapacity: 25,
    },
  });

  console.log(`✓ Created 3 spots across cities\n`);

  // Create Test Client User
  const clientUser = await prisma.user.create({
    data: {
      email: 'client@test.com',
      phone: '+48500100200',
      password: await bcrypt.hash('client123', 10),
      name: 'Jan Kowalski',
      firstName: 'Jan',
      surname: 'Kowalski',
      emailVerified: true,
      phoneVerified: true,
      roles: [Role.CLIENT],
      language: Language.PL,
      preferredCityId: warsaw.id,
      locationPermission: true,
      notificationPermission: true,
      pointBalance: {
        create: {
          totalPoints: 1500,
          availablePoints: 1500,
          lockedPoints: 0,
        },
      },
      referralCode: {
        create: {
          code: 'JAN123ABC',
        },
      },
    },
  });

  console.log(`✓ Created test client: ${clientUser.email}`);

  // Create Courier User
  const courierUser = await prisma.user.create({
    data: {
      email: 'courier@test.com',
      phone: '+48500200300',
      password: await bcrypt.hash('courier123', 10),
      name: 'Piotr Nowak',
      firstName: 'Piotr',
      surname: 'Nowak',
      emailVerified: true,
      phoneVerified: true,
      roles: [Role.COURIER],
      language: Language.PL,
      preferredCityId: warsaw.id,
      courierProfile: {
        create: {
          isOnline: false,
          isAvailable: false,
          totalDeliveries: 0,
          totalEarnings: 0,
        },
      },
    },
  });

  console.log(`✓ Created test courier: ${courierUser.email}`);

  // Create Tastes for Warsaw Center Spot
  const tastes = [
    {
      title: 'Vanilla Bean',
      titleLocal: { pl: 'Wanilia Bourbon', en: 'Vanilla Bean', ua: 'Ваніль' },
      subtitle: 'Milk-based classic',
      description: 'Rich Madagascar vanilla with real vanilla bean specks',
      descriptionLocal: {
        pl: 'Bogata wanilia z Madagaskaru z prawdziwymi cząstkami laski waniliowej',
        en: 'Rich Madagascar vanilla with real vanilla bean specks',
        ua: 'Багата ваніль з Мадагаскару зі справжніми частинками ванільного стручка',
      },
      type: TasteType.MILK,
      kcalPerPortion: 220,
      kcalPer100g: 180,
      portionSizeGrams: 120,
      allergens: ['milk'],
      ingredients:
        '<p><b>Milk</b>, cream, sugar, <span style="color:#b45309">Madagascar vanilla bean</span>, egg yolk, stabilizer.</p>',
      ingredientsLocal: {
        pl: '<p><b>Mleko</b>, śmietanka, cukier, <span style="color:#b45309">laska wanilii z Madagaskaru</span>, żółtko jaja, stabilizator.</p>',
        en: '<p><b>Milk</b>, cream, sugar, <span style="color:#b45309">Madagascar vanilla bean</span>, egg yolk, stabilizer.</p>',
        ua: '<p><b>Молоко</b>, вершки, цукор, <span style="color:#b45309">ванільний стручок з Мадагаскару</span>, яєчний жовток, стабілізатор.</p>',
      },
    },
    {
      title: 'Strawberry Sorbet',
      titleLocal: { pl: 'Sorbet Truskawkowy', en: 'Strawberry Sorbet', ua: 'Полуничний Сорбет' },
      subtitle: 'Vegan, dairy-free',
      description: 'Fresh Polish strawberries, light and refreshing',
      descriptionLocal: {
        pl: 'Świeże polskie truskawki, lekkie i orzeźwiające',
        en: 'Fresh Polish strawberries, light and refreshing',
        ua: 'Свіжі польські полуниці, легкі та освіжаючі',
      },
      type: TasteType.SORBET,
      kcalPerPortion: 120,
      kcalPer100g: 100,
      portionSizeGrams: 120,
      allergens: [],
    },
    {
      title: 'Pistachio Gelato',
      titleLocal: { pl: 'Pistacjowe Gelato', en: 'Pistachio Gelato', ua: 'Фісташкове Джелато' },
      subtitle: 'Sicilian style',
      description: 'Authentic Italian pistachio from Bronte, Sicily',
      descriptionLocal: {
        pl: 'Autentyczne włoskie pistacje z Bronte na Sycylii',
        en: 'Authentic Italian pistachio from Bronte, Sicily',
        ua: 'Автентичні італійські фісташки з Бронте, Сицилія',
      },
      type: TasteType.GELATO,
      kcalPerPortion: 250,
      kcalPer100g: 210,
      portionSizeGrams: 120,
      allergens: ['milk', 'nuts'],
    },
    {
      title: 'Dark Chocolate',
      titleLocal: { pl: 'Ciemna Czekolada', en: 'Dark Chocolate', ua: 'Темний Шоколад' },
      subtitle: '70% cocoa',
      description: 'Rich Belgian dark chocolate, intense flavor',
      descriptionLocal: {
        pl: 'Bogata belgijska ciemna czekolada, intensywny smak',
        en: 'Rich Belgian dark chocolate, intense flavor',
        ua: 'Багатий бельгійський темний шоколад, інтенсивний смак',
      },
      type: TasteType.MILK,
      kcalPerPortion: 230,
      kcalPer100g: 195,
      portionSizeGrams: 120,
      allergens: ['milk'],
    },
    {
      title: 'Mango Sorbet',
      titleLocal: { pl: 'Sorbet Mango', en: 'Mango Sorbet', ua: 'Манго Сорбет' },
      subtitle: 'Tropical vegan',
      description: 'Sweet Alphonso mango from India',
      descriptionLocal: {
        pl: 'Słodkie mango Alphonso z Indii',
        en: 'Sweet Alphonso mango from India',
        ua: 'Солодке манго Альфонсо з Індії',
      },
      type: TasteType.SORBET,
      kcalPerPortion: 110,
      kcalPer100g: 95,
      portionSizeGrams: 120,
      allergens: [],
    },
  ];

  for (const taste of tastes) {
    await prisma.taste.create({
      data: {
        ...taste,
        spotId: spotWarsaw1.id,
      },
    });
  }

  console.log(`✓ Created ${tastes.length} tastes for Warsaw Center spot`);

  // Tastes for Krakow (the only spot in its city -> exercises the single-spot shortcut)
  const krakowTastes = [
    {
      title: 'Salted Caramel',
      titleLocal: { pl: 'Słony Karmel', en: 'Salted Caramel', ua: 'Солона Карамель' },
      subtitle: 'Milk-based',
      description: 'Buttery caramel with a pinch of sea salt',
      descriptionLocal: {
        pl: 'Maślany karmel ze szczyptą soli morskiej',
        en: 'Buttery caramel with a pinch of sea salt',
        ua: 'Масляна карамель з дрібкою морської солі',
      },
      type: TasteType.MILK,
      kcalPerPortion: 240,
      kcalPer100g: 200,
      portionSizeGrams: 120,
      allergens: ['milk'],
      ingredients:
        '<p><b>Milk</b>, cream, <span style="color:#b45309">caramelized sugar</span>, sea salt, glucose syrup.</p>',
      ingredientsLocal: {
        pl: '<p><b>Mleko</b>, śmietanka, <span style="color:#b45309">cukier karmelizowany</span>, sól morska, syrop glukozowy.</p>',
        en: '<p><b>Milk</b>, cream, <span style="color:#b45309">caramelized sugar</span>, sea salt, glucose syrup.</p>',
        ua: '<p><b>Молоко</b>, вершки, <span style="color:#b45309">карамелізований цукор</span>, морська сіль, глюкозний сироп.</p>',
      },
    },
    {
      title: 'Raspberry Sorbet',
      titleLocal: { pl: 'Sorbet Malinowy', en: 'Raspberry Sorbet', ua: 'Малиновий Сорбет' },
      subtitle: 'Vegan, dairy-free',
      description: 'Tart raspberries, intensely fruity',
      descriptionLocal: {
        pl: 'Kwaśne maliny, intensywnie owocowe',
        en: 'Tart raspberries, intensely fruity',
        ua: 'Кислі малини, інтенсивно фруктові',
      },
      type: TasteType.SORBET,
      kcalPerPortion: 115,
      kcalPer100g: 96,
      portionSizeGrams: 120,
      allergens: [],
      ingredients:
        '<p><b>Raspberry purée</b> (60%), water, sugar, lemon juice.</p>',
      ingredientsLocal: {
        pl: '<p><b>Przecier malinowy</b> (60%), woda, cukier, sok z cytryny.</p>',
        en: '<p><b>Raspberry purée</b> (60%), water, sugar, lemon juice.</p>',
        ua: '<p><b>Малинове пюре</b> (60%), вода, цукор, лимонний сік.</p>',
      },
    },
  ];

  for (const taste of krakowTastes) {
    await prisma.taste.create({
      data: {
        ...taste,
        spotId: spotKrakow1.id,
      },
    });
  }

  console.log(`✓ Created ${krakowTastes.length} tastes for Krakow Rynek spot`);

  // Create Products (non-ice cream)
  await prisma.product.create({
    data: {
      spotId: spotWarsaw1.id,
      name: 'Espresso',
      nameLocal: { pl: 'Espresso', en: 'Espresso', ua: 'Еспресо' },
      description: 'Double shot Italian espresso',
      descriptionLocal: {
        pl: 'Podwójne espresso w stylu włoskim',
        en: 'Double shot Italian espresso',
        ua: 'Подвійний італійський еспресо',
      },
      type: 'COFFEE' as any,
      price: 12.0,
      kcalPerPortion: 5,
      allergens: [],
    },
  });

  await prisma.product.create({
    data: {
      spotId: spotWarsaw1.id,
      name: 'Cappuccino',
      nameLocal: { pl: 'Cappuccino', en: 'Cappuccino', ua: 'Капучіно' },
      description: 'Classic Italian cappuccino with foam art',
      descriptionLocal: {
        pl: 'Klasyczne włoskie cappuccino z pianką latte art',
        en: 'Classic Italian cappuccino with foam art',
        ua: 'Класичне італійське капучіно з пінним арт',
      },
      type: 'COFFEE' as any,
      price: 15.0,
      kcalPerPortion: 80,
      allergens: ['milk'],
    },
  });

  console.log(`✓ Created 2 coffee products\n`);

  // Create Prizes
  const prize1 = await prisma.prize.create({
    data: {
      title: 'Free Ice Cream Portion',
      titleLocal: {
        pl: 'Darmowa porcja lodów',
        en: 'Free Ice Cream Portion',
        ua: 'Безкоштовна порція морозива',
      },
      description: 'Redeem for one free portion of any taste',
      descriptionLocal: {
        pl: 'Wymień na jedną darmową porcję dowolnego smaku',
        en: 'Redeem for one free portion of any taste',
        ua: 'Обміняйте на одну безкоштовну порцію будь-якого смаку',
      },
      pointsCost: 500,
      isActive: true,
    },
  });

  const prize2 = await prisma.prize.create({
    data: {
      title: 'Free Coffee',
      titleLocal: { pl: 'Darmowa kawa', en: 'Free Coffee', ua: 'Безкоштовна кава' },
      description: 'Any coffee beverage of your choice',
      descriptionLocal: {
        pl: 'Dowolny napój kawowy do wyboru',
        en: 'Any coffee beverage of your choice',
        ua: 'Будь-який кавовий напій на вибір',
      },
      pointsCost: 300,
      isActive: true,
    },
  });

  const prize3 = await prisma.prize.create({
    data: {
      title: 'Free Delivery',
      titleLocal: { pl: 'Darmowa dostawa', en: 'Free Delivery', ua: 'Безкоштовна доставка' },
      description: 'Free delivery on your next order',
      descriptionLocal: {
        pl: 'Darmowa dostawa przy następnym zamówieniu',
        en: 'Free delivery on your next order',
        ua: 'Безкоштовна доставка при наступному замовленні',
      },
      pointsCost: 200,
      quantity: 50,
      claimed: 12,
      isActive: true,
    },
  });

  const prize4 = await prisma.prize.create({
    data: {
      title: '50% Off Coupon',
      titleLocal: { pl: 'Kupon 50% zniżki', en: '50% Off Coupon', ua: 'Купон знижка 50%' },
      description: '50% discount on your next purchase',
      descriptionLocal: {
        pl: '50% zniżki na następny zakup',
        en: '50% discount on your next purchase',
        ua: '50% знижки на наступну покупку',
      },
      pointsCost: 800,
      quantity: 20,
      claimed: 5,
      isActive: true,
    },
  });

  const prize5 = await prisma.prize.create({
    data: {
      title: 'Premium Sundae',
      titleLocal: { pl: 'Premium Sundae', en: 'Premium Sundae', ua: 'Преміум Сандей' },
      description: 'Exclusive premium ice cream sundae with toppings',
      descriptionLocal: {
        pl: 'Ekskluzywne premium sundae z dodatkami',
        en: 'Exclusive premium ice cream sundae with toppings',
        ua: 'Ексклюзивний преміум сандей з топінгами',
      },
      pointsCost: 1000,
      quantity: 10,
      claimed: 2,
      isActive: true,
    },
  });

  console.log(`✓ Created 5 prizes\n`);

  // Create News Post
  await prisma.news.create({
    data: {
      title: 'New Summer Flavors!',
      titleLocal: {
        pl: 'Nowe letnie smaki!',
        en: 'New Summer Flavors!',
        ua: 'Нові літні смаки!',
      },
      description:
        'Try our new seasonal summer tastes: Watermelon Sorbet and Lemon Basil Gelato!',
      descriptionLocal: {
        pl: 'Spróbuj naszych nowych sezonowych letnich smaków: Sorbet Arbuzowy i Gelato Cytrynowo-Bazyliowe!',
        en: 'Try our new seasonal summer tastes: Watermelon Sorbet and Lemon Basil Gelato!',
        ua: 'Спробуйте наші нові сезонні літні смаки: Кавуновий Сорбет та Лимонно-Базилікове Джелато!',
      },
      images: [],
      targetCityIds: [],
      isPublished: true,
      publishedAt: new Date(),
      likesCount: 0,
      commentsCount: 0,
    },
  });

  // Create more news posts
  await prisma.news.create({
    data: {
      title: 'Grand Opening in Krakow!',
      titleLocal: {
        pl: 'Wielkie otwarcie w Krakowie!',
        en: 'Grand Opening in Krakow!',
        ua: 'Велике відкриття в Кракові!',
      },
      description: 'Join us for our new location opening on Saturday. Free samples all day!',
      descriptionLocal: {
        pl: 'Dołącz do nas na otwarcie nowej lokalizacji w sobotę. Darmowe próbki przez cały dzień!',
        en: 'Join us for our new location opening on Saturday. Free samples all day!',
        ua: 'Приєднуйтесь до нас на відкриття нової локації в суботу. Безкоштовні зразки весь день!',
      },
      images: [],
      targetCityIds: [krakow.id],
      isPublished: true,
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      likesCount: 45,
      commentsCount: 12,
    },
  });

  await prisma.news.create({
    data: {
      title: 'Weekend Special: Buy 2 Get 1 Free',
      titleLocal: {
        pl: 'Weekendowa promocja: Kup 2 otrzymaj 1 gratis',
        en: 'Weekend Special: Buy 2 Get 1 Free',
        ua: 'Вихідна акція: Купи 2 отримай 1 безкоштовно',
      },
      description: 'This weekend only! Purchase any 2 ice cream portions and get a 3rd one free.',
      descriptionLocal: {
        pl: 'Tylko w ten weekend! Kup dowolne 2 porcje lodów i otrzymaj 3. gratis.',
        en: 'This weekend only! Purchase any 2 ice cream portions and get a 3rd one free.',
        ua: 'Тільки цих вихідних! Придбайте будь-які 2 порції морозива і отримайте 3-тю безкоштовно.',
      },
      images: [],
      targetCityIds: [],
      isPublished: true,
      publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      likesCount: 128,
      commentsCount: 23,
    },
  });

  await prisma.news.create({
    data: {
      title: 'Loyalty Program Launch',
      titleLocal: {
        pl: 'Uruchomienie programu lojalnościowego',
        en: 'Loyalty Program Launch',
        ua: 'Запуск програми лояльності',
      },
      description: 'Earn points with every order and redeem them for amazing prizes!',
      descriptionLocal: {
        pl: 'Zbieraj punkty z każdym zamówieniem i wymieniaj je na niesamowite nagrody!',
        en: 'Earn points with every order and redeem them for amazing prizes!',
        ua: 'Заробляйте бали з кожним замовленням та обмінюйте їх на дивовижні призи!',
      },
      images: [],
      targetCityIds: [],
      isPublished: true,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      likesCount: 92,
      commentsCount: 18,
    },
  });

  console.log(`✓ Created 4 news posts\n`);

  // Create Quests
  await prisma.quest.create({
    data: {
      type: 'REFERRAL' as any,
      title: 'Refer a Friend',
      titleLocal: {
        pl: 'Poleć znajomego',
        en: 'Refer a Friend',
        ua: 'Запросіть друга',
      },
      description: 'Invite friends and earn 500 points when they make their first purchase!',
      descriptionLocal: {
        pl: 'Zaproś znajomych i zdobądź 500 punktów po ich pierwszym zakupie!',
        en: 'Invite friends and earn 500 points when they make their first purchase!',
        ua: 'Запросіть друзів та заробіть 500 балів після їхньої першої покупки!',
      },
      pointsReward: 500,
      isActive: true,
      isRepeatable: true,
      targetCityIds: [],
      targetSpotIds: [],
    },
  });

  await prisma.quest.create({
    data: {
      type: 'BIRTHDAY' as any,
      title: 'Birthday Reward',
      titleLocal: {
        pl: 'Nagroda urodzinowa',
        en: 'Birthday Reward',
        ua: 'Нагорода на день народження',
      },
      description: 'Add your birthday and get 700 bonus points!',
      descriptionLocal: {
        pl: 'Dodaj datę urodzin i otrzymaj 700 punktów bonusowych!',
        en: 'Add your birthday and get 700 bonus points!',
        ua: 'Додайте свій день народження та отримайте 700 бонусних балів!',
      },
      pointsReward: 700,
      isActive: true,
      isRepeatable: false,
      targetCityIds: [],
      targetSpotIds: [],
    },
  });

  console.log(`✓ Created 2 default quests\n`);

  console.log('🎉 Database seeding completed successfully!\n');
  console.log('📊 Summary:');
  console.log(`   - 1 Super Admin (email: superadmin@gelato.com, password: admin123)`);
  console.log(`   - 1 Test Client (email: client@test.com, password: client123)`);
  console.log(`   - 1 Test Courier (email: courier@test.com, password: courier123)`);
  console.log(`   - 3 Cities (Warsaw, Krakow, Lviv)`);
  console.log(`   - 3 Ice Cream Spots`);
  console.log(`   - 5 Ice Cream Tastes`);
  console.log(`   - 2 Coffee Products`);
  console.log(`   - 5 Prizes`);
  console.log(`   - 2 Quests`);
  console.log(`   - 4 News Posts\n`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
