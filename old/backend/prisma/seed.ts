import { Prisma, PrismaClient, User } from '@prisma/client'
import { hashPassword } from '../src/Auth/PasswordUtil'

const prisma = new PrismaClient()

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL)

  // Create test users
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: {},
    create: {
      email: 'admin@gmail.com',
      name: 'Admin User',
      password: await hashPassword('hasloadmingmail'),
      roles: ['ADMIN'],
      registrationSource: 'WEB_MERCHANT',
      firstName: 'Admin',
      surname: 'User',
      emailVerified: true,
      profileType: 'local',
    },
  })

  const client = await prisma.user.upsert({
    where: { email: 'client@gmail.com' },
    update: {},
    create: {
      email: 'client@gmail.com',
      name: 'Client User',
      password: await hashPassword('hasloklientgmail'),
      roles: ['CLIENT'],
      registrationSource: 'MOBILE_CLIENT',
      firstName: 'Client',
      surname: 'User',
      emailVerified: true,
      profileType: 'local',
    },
  })

  const owner = await prisma.user.upsert({
    where: { email: 'owner@gmail.com' },
    update: {},
    create: {
      email: 'owner@gmail.com',
      name: 'Owner User',
      password: await hashPassword('hasloownergmail'),
      roles: ['OWNER'],
      registrationSource: 'WEB_MERCHANT',
      firstName: 'Owner',
      surname: 'User',
      emailVerified: true,
      profileType: 'local',
    },
  })

  // Create profiles
  await prisma.client.upsert({
    where: { userId: client.id },
    update: {},
    create: { userId: client.id },
  })

  const ownerCompany = await prisma.company.upsert({
    where: { userId: owner.id },
    update: {},
    create: {
      userId: owner.id,
      name: 'Test Company',
      address: 'ul. Testowa 1',
      city: 'Kraków',
      country: 'Polska',
      phone: '+48123456789',
      email: 'test@company.com',
    },
  })

  const companyOwner = await prisma.companyOwner.upsert({
    where: { userId: owner.id },
    update: {},
    create: {
      userId: owner.id,
      companyId: ownerCompany.id,
    },
  })

  // Categories
  const bakeryCategory = await prisma.category.upsert({
    where: { slug: 'bakery' },
    update: {},
    create: {
      name: 'Bakery',
      slug: 'bakery',
      description: 'Bakeries and pastry shops',
      iconUrl: '/api/static/categories/bakery.svg',
      iconPngUrl: '/api/static/categories/bakery.png',
    },
  })

  const beautyCategory = await prisma.category.upsert({
    where: { slug: 'beauty' },
    update: {},
    create: {
      name: 'Beauty',
      slug: 'beauty',
      description: 'Beauty salons and cosmetics',
      iconUrl: '/api/static/categories/beauty.svg',
      iconPngUrl: '/api/static/categories/beauty.png',
    },
  })

  const bookStoreCategory = await prisma.category.upsert({
    where: { slug: 'book-store' },
    update: {},
    create: {
      name: 'Book Store',
      slug: 'book-store',
      description: 'Bookstores and libraries',
      iconUrl: '/api/static/categories/book_store.svg',
      iconPngUrl: '/api/static/categories/book_store.png',
    },
  })

  const caffeCategory = await prisma.category.upsert({
    where: { slug: 'caffe' },
    update: { iconPngUrl: '/api/static/categories/caffe.png' },
    create: {
      name: 'Caffe',
      slug: 'caffe',
      description: 'Coffee shops and cafes',
      iconUrl: '/api/static/categories/caffe.svg',
      iconPngUrl: '/api/static/categories/caffe.png',
    },
  })

  const cinemaCategory = await prisma.category.upsert({
    where: { slug: 'cinema' },
    update: {},
    create: {
      name: 'Cinema',
      slug: 'cinema',
      description: 'Movie theaters and entertainment',
      iconUrl: '/api/static/categories/cinema.svg',
      iconPngUrl: '/api/static/categories/cinema.png',
    },
  })

  const donutCategory = await prisma.category.upsert({
    where: { slug: 'donut' },
    update: {},
    create: {
      name: 'Donut',
      slug: 'donut',
      description: 'Donut shops and sweet treats',
      iconUrl: '/api/static/categories/donut.svg',
      iconPngUrl: '/api/static/categories/donut.png',
    },
  })

  const fastFoodCategory = await prisma.category.upsert({
    where: { slug: 'fast-food' },
    update: {},
    create: {
      name: 'Fast Food',
      slug: 'fast-food',
      description: 'Fast food restaurants',
      iconUrl: '/api/static/categories/fast_food.svg',
      iconPngUrl: '/api/static/categories/fast_food.png',
    },
  })

  const garageCategory = await prisma.category.upsert({
    where: { slug: 'garage' },
    update: {},
    create: {
      name: 'Garage',
      slug: 'garage',
      description: 'Auto repair and car services',
      iconUrl: '/api/static/categories/garage.svg',
      iconPngUrl: '/api/static/categories/garage.png',
    },
  })

  const groceryCategory = await prisma.category.upsert({
    where: { slug: 'grocery' },
    update: {},
    create: {
      name: 'Grocery',
      slug: 'grocery',
      description: 'Grocery stores and supermarkets',
      iconUrl: '/api/static/categories/grocery.svg',
      iconPngUrl: '/api/static/categories/grocery.png',
    },
  })

  const gymCategory = await prisma.category.upsert({
    where: { slug: 'gym' },
    update: {},
    create: {
      name: 'Gym',
      slug: 'gym',
      description: 'Fitness centers and gyms',
      iconUrl: '/api/static/categories/gym.svg',
      iconPngUrl: '/api/static/categories/gym.png',
    },
  })

  const haircutCategory = await prisma.category.upsert({
    where: { slug: 'haircut' },
    update: {},
    create: {
      name: 'Haircut',
      slug: 'haircut',
      description: 'Hair salons and barbers',
      iconUrl: '/api/static/categories/haircut.svg',
      iconPngUrl: '/api/static/categories/haircut.png',
    },
  })

  const iceCreamCategory = await prisma.category.upsert({
    where: { slug: 'ice-cream' },
    update: { iconPngUrl: '/api/static/categories/ice_cream.png' },
    create: {
      name: 'Ice Cream',
      slug: 'ice-cream',
      description: 'Ice cream shops and gelato',
      iconUrl: '/api/static/categories/ice_cream.svg',
      iconPngUrl: '/api/static/categories/ice_cream.png',
    },
  })

  const pizzaCategory = await prisma.category.upsert({
    where: { slug: 'pizza' },
    update: { iconPngUrl: '/api/static/categories/pizza.png' },
    create: {
      name: 'Pizza',
      slug: 'pizza',
      description: 'Pizza restaurants and delivery',
      iconUrl: '/api/static/categories/pizza.svg',
      iconPngUrl: '/api/static/categories/pizza.png',
    },
  })

  const pubCategory = await prisma.category.upsert({
    where: { slug: 'pub' },
    update: {},
    create: {
      name: 'Pub',
      slug: 'pub',
      description: 'Pubs and bars',
      iconUrl: '/api/static/categories/pub.svg',
      iconPngUrl: '/api/static/categories/pub.png',
    },
  })

  const spaCategory = await prisma.category.upsert({
    where: { slug: 'spa' },
    update: {},
    create: {
      name: 'Spa',
      slug: 'spa',
      description: 'Spa and wellness centers',
      iconUrl: '/api/static/categories/spa.svg',
      iconPngUrl: '/api/static/categories/spa.png',
    },
  })

  const travelCategory = await prisma.category.upsert({
    where: { slug: 'travel' },
    update: {},
    create: {
      name: 'Travel',
      slug: 'travel',
      description: 'Travel agencies and tourism',
      iconUrl: '/api/static/categories/travel.svg',
      iconPngUrl: '/api/static/categories/travel.png',
    },
  })

  const wellnessCategory = await prisma.category.upsert({
    where: { slug: 'wellness' },
    update: {},
    create: {
      name: 'Wellness',
      slug: 'wellness',
      description: 'Wellness and health services',
      iconUrl: '/api/static/categories/wellness.svg',
      iconPngUrl: '/api/static/categories/wellness.png',
    },
  })

  // Merchants
  const starbucks = await prisma.merchant.upsert({
    where: { slug: 'starbucks' },
    update: { logoUrl: '/api/static/logos/starbucks.png', iconUrl: '/api/static/logos/starbucks.png' },
    create: {
      name: 'Starbucks',
      slug: 'starbucks',
      description: 'Global coffeehouse chain',
      logoUrl: '/api/static/logos/starbucks.png',
      iconUrl: '/api/static/logos/starbucks.png',
      categoryId: caffeCategory.id,
    },
  })

  const mcdonalds = await prisma.merchant.upsert({
    where: { slug: 'mcdonalds' },
    update: { logoUrl: '/api/static/logos/mcdonalds.png', iconUrl: '/api/static/logos/mcdonalds.png' },
    create: {
      name: "McDonald's",
      slug: 'mcdonalds',
      description: 'Fast food restaurant chain',
      logoUrl: '/api/static/logos/mcdonalds.png',
      iconUrl: '/api/static/logos/mcdonalds.png',
      categoryId: fastFoodCategory.id,
    },
  })

  const burgerKing = await prisma.merchant.upsert({
    where: { slug: 'burger-king' },
    update: { logoUrl: '/api/static/logos/burger_king.png', iconUrl: '/api/static/logos/burger_king.png' },
    create: {
      name: 'Burger King',
      slug: 'burger-king',
      description: 'Fast food restaurant chain',
      logoUrl: '/api/static/logos/burger_king.png',
      iconUrl: '/api/static/logos/burger_king.png',
      categoryId: fastFoodCategory.id,
    },
  })

  const numeroUno = await prisma.merchant.upsert({
    where: { slug: 'numero-uno' },
    update: { logoUrl: '/api/static/logos/numero_uno.png', iconUrl: '/api/static/logos/numero_uno.png' },
    create: {
      name: 'NumerUno',
      slug: 'numero-uno',
      description: 'Włoska pizzeria',
      logoUrl: '/api/static/logos/numero_uno.png',
      iconUrl: '/api/static/logos/numero_uno.png',
      categoryId: pizzaCategory.id,
      companyId: ownerCompany.id,
    },
  })

  const alanyaKebab = await prisma.merchant.upsert({
    where: { slug: 'alanya-kebab' },
    update: { logoUrl: '/api/static/logos/alanya_kebab.png', iconUrl: '/api/static/logos/alanya_kebab.png' },
    create: {
      name: 'Alanya Kebab',
      slug: 'alanya-kebab',
      description: 'Autentyczny kebab turecki',
      logoUrl: '/api/static/logos/alanya_kebab.png',
      iconUrl: '/api/static/logos/alanya_kebab.png',
      categoryId: fastFoodCategory.id,
    },
  })

  const pointSushi = await prisma.merchant.upsert({
    where: { slug: 'point-sushi' },
    update: { logoUrl: '/api/static/logos/sushi_point.png', iconUrl: '/api/static/logos/sushi_point.png' },
    create: {
      name: 'Point Sushi',
      slug: 'point-sushi',
      description: 'Świeże sushi i kuchnia japońska',
      logoUrl: '/api/static/logos/sushi_point.png',
      iconUrl: '/api/static/logos/sushi_point.png',
      categoryId: fastFoodCategory.id,
    },
  })

  const owocowyBazarek = await prisma.merchant.upsert({
    where: { slug: 'owocowy-bazarek' },
    update: { logoUrl: '/api/static/logos/owocowy_bazarek.png', iconUrl: '/api/static/logos/owocowy_bazarek.png' },
    create: {
      name: 'Owocowy Bazarek',
      slug: 'owocowy-bazarek',
      description: 'Świeże owoce i warzywa',
      logoUrl: '/api/static/logos/owocowy_bazarek.png',
      iconUrl: '/api/static/logos/owocowy_bazarek.png',
      categoryId: groceryCategory.id,
    },
  })

  const hermesParis = await prisma.merchant.upsert({
    where: { slug: 'hermes-paris' },
    update: { logoUrl: '/api/static/logos/hermes.png', iconUrl: '/api/static/logos/hermes.png' },
    create: {
      name: 'Hermès Paris',
      slug: 'hermes-paris',
      description: 'Luksusowe torebki i akcesoria',
      logoUrl: '/api/static/logos/hermes.png',
      iconUrl: '/api/static/logos/hermes.png',
      categoryId: groceryCategory.id,
    },
  })

  const bonito = await prisma.merchant.upsert({
    where: { slug: 'bonito' },
    update: { logoUrl: '/api/static/logos/bonito-icon.svg', iconUrl: '/api/static/logos/bonito-icon.svg' },
    create: {
      name: 'Bonito',
      slug: 'bonito',
      description: 'Książki i akcesoria czytelnicze',
      logoUrl: '/api/static/logos/bonito-icon.svg',
      iconUrl: '/api/static/logos/bonito-icon.svg',
      categoryId: bookStoreCategory.id,
    },
  })

  // const travelCategory = await prisma.category.upsert({
  //   where: { slug: 'travel' },
  //   update: {
  //     iconPngUrl: '/api/static/categories/default.png',
  //   },
  //   create: {
  //     name: 'Travel',
  //     slug: 'travel',
  //     description: 'Hotels, flights, and travel services',
  //     iconUrl: '/api/static/categories/default.svg',
  //     iconPngUrl: '/api/static/categories/default.png',
  //   },
  // })

  const airbnb = await prisma.merchant.upsert({
    where: { slug: 'airbnb' },
    update: {},
    create: {
      name: 'Airbnb',
      slug: 'airbnb',
      description: 'Wyjątkowe noclegi i doświadczenia',
      logoUrl: '/airbnb-icon.svg',
      iconUrl: '/airbnb-icon.svg',
      categoryId: travelCategory.id,
    },
  })

  // Stores with images
  await prisma.merchantStore.upsert({
    where: { id: 'starbucks-krakowska' },
    update: {
      address: 'ul. Pawia 5',
      description:
        'Nasza kawiarnia w Galerii Krakowskiej oferuje szeroki wybór kaw specialty, herbat oraz świeżych wypieków. Przyjazna atmosfera i wygodne miejsce na spotkania w centrum handlowym.',
    },
    create: {
      id: 'starbucks-krakowska',
      merchantId: starbucks.id,
      name: 'Starbucks - Galeria Krakowska',
      description:
        'Nasza kawiarnia w Galerii Krakowskiej oferuje szeroki wybór kaw specialty, herbat oraz świeżych wypieków. Przyjazna atmosfera i wygodne miejsce na spotkania w centrum handlowym.',
      address: 'ul. Pawia 5',
      city: 'Kraków',
      country: 'Poland',
      postalCode: '31-050',
      phone: '+48 12 345 67 89',
      hours: '6:00 AM - 10:00 PM',
      latitude: 50.0673207,
      longitude: 19.9434591,
      logoUrl: '/api/static/logos/starbucks.png',
      photoUrl: '/api/static/logos/starbucks.png',
      categoryId: caffeCategory.id,
      images: [
        {
          url: '/api/static/stores/starbuck_galeria_krakowska/starbuck_krakowska_main.webp',
          type: 'main',
          alt: 'Store front',
        },
        {
          url: '/api/static/stores/starbuck_galeria_krakowska/starbucks_galeria_krakowska.webp',
          type: 'gallery',
          alt: 'Store view 2',
        },
        {
          url: '/api/static/stores/starbuck_galeria_krakowska/starbuck_krakowska_2.webp',
          type: 'gallery',
          alt: 'Store view 3',
        },
        {
          url: '/api/static/stores/starbuck_galeria_krakowska/starbuck_krakowska_polki.webp',
          type: 'gallery',
          alt: 'Store view 4',
        },
      ],
    },
  })

  await prisma.merchantStore.upsert({
    where: { id: 'mcdonalds-rynek-glowny' },
    update: {
      address: 'Rynek Główny 1',
      description:
        'Restauracja fast food w sercu Krakowa na Rynku Głównym. Oferujemy klasyczne burgery, frytki i napoje. Szybka obsługa i świeże produkty codziennie.',
    },
    create: {
      id: 'mcdonalds-rynek-glowny',
      merchantId: mcdonalds.id,
      name: "McDonald's - Rynek Główny",
      description:
        'Restauracja fast food w sercu Krakowa na Rynku Głównym. Oferujemy klasyczne burgery, frytki i napoje. Szybka obsługa i świeże produkty codziennie.',
      address: 'Rynek Główny 1',
      city: 'Kraków',
      country: 'Poland',
      postalCode: '31-019',
      phone: '+48 12 987 65 43',
      hours: '24/7',
      latitude: 50.061844,
      longitude: 19.9360555,
      logoUrl: '/api/static/logos/mcdonalds.png',
      photoUrl: '/api/static/logos/mcdonalds.png',
      categoryId: fastFoodCategory.id,
      images: [
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow.webp',
          type: 'main',
          alt: 'Store front',
        },
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow2.webp',
          type: 'gallery',
          alt: 'Store view 2',
        },
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow3.webp',
          type: 'gallery',
          alt: 'Store view 3',
        },
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow4.webp',
          type: 'gallery',
          alt: 'Store view 4',
        },
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow5.webp',
          type: 'gallery',
          alt: 'Store view 5',
        },
      ],
    },
  })

  await prisma.merchantStore.upsert({
    where: { id: 'burger-king-serenada' },
    update: {
      address: 'ul. Serenady 15',
      description:
        'Burger King w Galerii Serenada zaprasza na flame-grilled burgery, crispy frytki i pyszne desery. Idealne miejsce na szybki posiłek podczas zakupów.',
    },
    create: {
      id: 'burger-king-serenada',
      merchantId: burgerKing.id,
      name: 'Burger King - Serenada',
      address: 'ul. Serenady 15',
      description:
        'Burger King w Galerii Serenada zaprasza na flame-grilled burgery, crispy frytki i pyszne desery. Idealne miejsce na szybki posiłek podczas zakupów.',
      city: 'Kraków',
      country: 'Poland',
      postalCode: '31-509',
      phone: '+48 12 555 44 33',
      hours: '10:00 AM - 11:00 PM',
      latitude: 50.0875266,
      longitude: 19.9665999,
      logoUrl: '/api/static/logos/burger_king.png',
      photoUrl: '/api/static/logos/burger_king.png',
      categoryId: fastFoodCategory.id,
      images: [
        { url: '/api/static/stores/burger_king_serenada/burger_king_serenada.webp', type: 'main', alt: 'Store front' },
        {
          url: '/api/static/stores/burger_king_serenada/burger_king_serenada2.webp',
          type: 'gallery',
          alt: 'Store view 2',
        },
      ],
    },
  })

  await prisma.merchantStore.upsert({
    where: { id: 'numero-uno-oswiecenia' },
    update: {
      address: 'ul. Oświecenia 35',
      description:
        'Autentyczna włoska pizzeria serwująca pizzę na cienkim cieście z piekarnika opalanego drewnem. Świeże składniki, tradycyjne receptury i rodzinna atmosfera.',
    },
    create: {
      id: 'numero-uno-oswiecenia',
      merchantId: numeroUno.id,
      name: 'NumerUno - Oświecenia',
      address: 'ul. Oświecenia 35',
      description:
        'Autentyczna włoska pizzeria serwująca pizzę na cienkim cieście z piekarnika opalanego drewnem. Świeże składniki, tradycyjne receptury i rodzinna atmosfera.',
      city: 'Kraków',
      country: 'Poland',
      postalCode: '31-509',
      phone: '+48 12 666 77 88',
      hours: '12:00 PM - 11:00 PM',
      latitude: 50.0914242,
      longitude: 19.985655,
      logoUrl: '/api/static/logos/numero_uno.png',
      photoUrl: '/api/static/logos/numero_uno.png',
      categoryId: pizzaCategory.id,
      images: [
        { url: '/api/static/stores/numer_uno_krakow/numero_uno_krakow.webp', type: 'main', alt: 'Store front' },
        { url: '/api/static/stores/numer_uno_krakow/numero_uno_krakow2.webp', type: 'gallery', alt: 'Store view 2' },
        { url: '/api/static/stores/numer_uno_krakow/numero_uno_krakow3.webp', type: 'gallery', alt: 'Store view 3' },
      ],
    },
  })

  await prisma.merchantStore.upsert({
    where: { id: 'alanya-kebab-oswiecenia' },
    update: {
      address: 'ul. Oświecenia 45',
      description:
        'Prawdziwy turecki kebab przygotowywany według oryginalnych receptur. Świeże mięso, aromatyczne przyprawy i domowe sosy. Szybka obsługa i przystępne ceny.',
    },
    create: {
      id: 'alanya-kebab-oswiecenia',
      merchantId: alanyaKebab.id,
      name: 'Alanya Kebab - Oświecenia',
      address: 'ul. Oświecenia 45',
      description:
        'Prawdziwy turecki kebab przygotowywany według oryginalnych receptur. Świeże mięso, aromatyczne przyprawy i domowe sosy. Szybka obsługa i przystępne ceny.',
      city: 'Kraków',
      country: 'Poland',
      postalCode: '31-509',
      phone: '+48 12 777 88 99',
      hours: '11:00 AM - 12:00 AM',
      latitude: 50.0938414,
      longitude: 19.986329,
      logoUrl: '/api/static/logos/alanya_kebab.png',
      photoUrl: '/api/static/logos/alanya_kebab.png',
      categoryId: fastFoodCategory.id,
      images: [
        {
          url: '/api/static/stores/alayna_kebab_oswiecenia/alayna_kebab_oswiecenia.webp',
          type: 'main',
          alt: 'Store front',
        },
        {
          url: '/api/static/stores/alayna_kebab_oswiecenia/alayna_kebab_oswiecenia2.webp',
          type: 'gallery',
          alt: 'Store view 2',
        },
        {
          url: '/api/static/stores/alayna_kebab_oswiecenia/alayna_kebab_oswiecenia3.webp',
          type: 'gallery',
          alt: 'Store view 3',
        },
      ],
    },
  })

  await prisma.merchantStore.upsert({
    where: { id: 'point-sushi-bohomolca' },
    update: {
      address: 'ul. Bohomolca 12',
      description:
        'Restauracja sushi oferująca świeże ryby, kreatywne zestawy i tradycyjne japońskie dania. Doświadczeni sushi masterzy i eleganckie wnętrze.',
    },
    create: {
      id: 'point-sushi-bohomolca',
      merchantId: pointSushi.id,
      name: 'Point Sushi - Bohomolca',
      address: 'ul. Bohomolca 12',
      description:
        'Restauracja sushi oferująca świeże ryby, kreatywne zestawy i tradycyjne japońskie dania. Doświadczeni sushi masterzy i eleganckie wnętrze.',
      city: 'Kraków',
      country: 'Poland',
      postalCode: '31-509',
      phone: '+48 12 888 99 00',
      hours: '12:00 PM - 10:00 PM',
      latitude: 50.0917313,
      longitude: 19.9856245,
      logoUrl: '/api/static/logos/sushi_point.png',
      photoUrl: '/api/static/logos/sushi_point.png',
      categoryId: fastFoodCategory.id,
      images: [
        {
          url: '/api/static/stores/point_sushi_bohomolca/point_sushi_bohomolca.webp',
          type: 'main',
          alt: 'Store front',
        },
        {
          url: '/api/static/stores/point_sushi_bohomolca/point_sushi_bohomolca2.webp',
          type: 'gallery',
          alt: 'Store view 2',
        },
        {
          url: '/api/static/stores/point_sushi_bohomolca/point_sushi_bohomolca3.webp',
          type: 'gallery',
          alt: 'Store view 3',
        },
      ],
    },
  })

  await prisma.merchantStore.upsert({
    where: { id: 'owocowy-bazarek-marcholta' },
    update: {
      address: 'ul. Marcholta 8',
      description:
        'Sklep z świeżymi owocami i warzywami prosto od lokalnych dostawców. Szeroki wybór sezonowych produktów, ekologiczne opcje i przyjazna obsługa.',
    },
    create: {
      id: 'owocowy-bazarek-marcholta',
      merchantId: owocowyBazarek.id,
      name: 'Owocowy Bazarek - Marcholta',
      address: 'ul. Marcholta 8',
      description:
        'Sklep z świeżymi owocami i warzywami prosto od lokalnych dostawców. Szeroki wybór sezonowych produktów, ekologiczne opcje i przyjazna obsługa.',
      city: 'Kraków',
      country: 'Poland',
      postalCode: '31-509',
      phone: '+48 12 999 00 11',
      hours: '7:00 AM - 8:00 PM',
      latitude: 50.0926652,
      longitude: 19.9845497,
      logoUrl: '/api/static/logos/owocowy_bazarek.png',
      photoUrl: '/api/static/logos/owocowy_bazarek.png',
      categoryId: fastFoodCategory.id,
      images: [
        {
          url: '/api/static/stores/owocowy_bazarek_marcholta_krakow/owocowy_bazarek_marcholta_krakow.webp',
          type: 'main',
          alt: 'Store front',
        },
        {
          url: '/api/static/stores/owocowy_bazarek_marcholta_krakow/owocowy_bazarek_marcholta_krakow2.webp',
          type: 'gallery',
          alt: 'Store view 2',
        },
        {
          url: '/api/static/stores/owocowy_bazarek_marcholta_krakow/owocowy_bazarek_marcholta_krakow3.webp',
          type: 'gallery',
          alt: 'Store view 3',
        },
      ],
    },
  })

  // Merchant Vouchers for Promoted Vouchers
  await prisma.merchantVoucher.upsert({
    where: { id: 'voucher-starbucks-coffee' },
    update: {
      storeId: 'starbucks-krakowska',
      displayType: 'PROMOTED',
      priority: 10,
      imageUrl: '/api/static/stores/starbuck_galeria_krakowska/vouchers/promoted/promoted_voucher.png',
      validUntil: new Date('2026-12-31'),
    },
    create: {
      id: 'voucher-starbucks-coffee',
      merchantId: starbucks.id,
      storeId: 'starbucks-krakowska',
      title: '30% zniżki na kawę',
      description: 'Specjalna promocja na wszystkie kawy',
      value: 30,
      pointsCost: 100,
      imageUrl: '/api/static/stores/starbuck_galeria_krakowska/vouchers/promoted/promoted_voucher.png',
      displayType: 'PROMOTED',
      priority: 10,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
    },
  })

  await prisma.merchantVoucher.upsert({
    where: { id: 'voucher-mcdonalds-bigmac' },
    update: {
      storeId: 'mcdonalds-rynek-glowny',
      displayType: 'PROMOTED',
      priority: 9,
      imageUrl: '/api/static/stores/mcdonald_rynek_glowny_krakow/vouchers/promoted/promoted_voucher.png',
      validUntil: new Date('2026-12-31'),
    },
    create: {
      id: 'voucher-mcdonalds-bigmac',
      merchantId: mcdonalds.id,
      storeId: 'mcdonalds-rynek-glowny',
      title: 'Kup 1 dostaniesz 2 Big Mac',
      description: 'Kup jeden Big Mac, dostaniesz drugi gratis',
      value: 20,
      pointsCost: 150,
      imageUrl: '/api/static/stores/mcdonald_rynek_glowny_krakow/vouchers/promoted/promoted_voucher.png',
      displayType: 'PROMOTED',
      priority: 9,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
    },
  })

  await prisma.merchantVoucher.upsert({
    where: { id: 'voucher-burger-king-whopper' },
    update: {
      storeId: 'burger-king-serenada',
      displayType: 'PROMOTED',
      priority: 8,
      imageUrl: '/api/static/stores/burger_king_serenada/vouchers/promoted/promoted_voucher.png',
      validUntil: new Date('2026-12-31'),
    },
    create: {
      id: 'voucher-burger-king-whopper',
      merchantId: burgerKing.id,
      storeId: 'burger-king-serenada',
      title: '50% zniżki na Whopper',
      description: 'Połowa ceny na kultowego Whoppera',
      value: 50,
      pointsCost: 120,
      imageUrl: '/api/static/stores/burger_king_serenada/vouchers/promoted/promoted_voucher.png',
      displayType: 'PROMOTED',
      priority: 8,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
    },
  })

  await prisma.merchantVoucher.upsert({
    where: { id: 'voucher-numero-uno-pizza' },
    update: {
      storeId: 'numero-uno-oswiecenia',
      displayType: 'PROMOTED',
      priority: 7,
      imageUrl: '/api/static/stores/numer_uno_krakow/vouchers/promoted/promoted_voucher.png',
      validUntil: new Date('2026-12-31'),
    },
    create: {
      id: 'voucher-numero-uno-pizza',
      merchantId: numeroUno.id,
      storeId: 'numero-uno-oswiecenia',
      title: 'Darmowa pizza przy zamówieniu powyżej 50zł',
      description: 'Zamów za minimum 50zł i otrzymaj małą pizzę gratis',
      value: 20,
      pointsCost: 180,
      imageUrl: '/api/static/stores/numer_uno_krakow/vouchers/promoted/promoted_voucher.png',
      displayType: 'PROMOTED',
      priority: 7,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
    },
  })

  await prisma.merchantVoucher.upsert({
    where: { id: 'voucher-alanya-kebab' },
    update: {
      storeId: 'alanya-kebab-oswiecenia',
      displayType: 'PROMOTED',
      priority: 6,
      imageUrl: '/api/static/stores/alayna_kebab_oswiecenia/vouchers/promoted/promoted_voucher.png',
      validUntil: new Date('2026-12-31'),
    },
    create: {
      id: 'voucher-alanya-kebab',
      merchantId: alanyaKebab.id,
      storeId: 'alanya-kebab-oswiecenia',
      title: '20% zniżki na kebab',
      description: 'Specjalna promocja na wszystkie kebaby',
      value: 20,
      pointsCost: 90,
      imageUrl: '/api/static/stores/alayna_kebab_oswiecenia/vouchers/promoted/promoted_voucher.png',
      displayType: 'PROMOTED',
      priority: 6,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
    },
  })

  await prisma.merchantVoucher.upsert({
    where: { id: 'voucher-point-sushi' },
    update: {
      storeId: 'point-sushi-bohomolca',
      displayType: 'PROMOTED',
      priority: 5,
      imageUrl: '/api/static/stores/point_sushi_bohomolca/vouchers/promoted/promoted_voucher.png',
      validUntil: new Date('2026-12-31'),
    },
    create: {
      id: 'voucher-point-sushi',
      merchantId: pointSushi.id,
      storeId: 'point-sushi-bohomolca',
      title: 'Kup 3 zestawy, zapłać za 2',
      description: 'Przy zakupie 3 zestawów sushi, najtańszy gratis',
      value: 30,
      pointsCost: 200,
      imageUrl: '/api/static/stores/point_sushi_bohomolca/vouchers/promoted/promoted_voucher.png',
      displayType: 'PROMOTED',
      priority: 5,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
    },
  })

  // HOT Vouchers - Alanya Kebab
  await prisma.merchantVoucher.upsert({
    where: { id: 'voucher-alanya-kebab-hot' },
    update: {
      storeId: 'alanya-kebab-oswiecenia',
      displayType: 'HOT',
      priority: 15,
      validUntil: new Date('2026-12-31'),
    },
    create: {
      id: 'voucher-alanya-kebab-hot',
      merchantId: alanyaKebab.id,
      storeId: 'alanya-kebab-oswiecenia',
      title: '🔥 50% zniżki na kebab XXL',
      description: 'Gorąca oferta! Mega kebab w super cenie',
      value: 50,
      pointsCost: 150,
      imageUrl: '/api/static/stores/alayna_kebab_oswiecenia/vouchers/hot/hot_voucher.png',
      displayType: 'HOT',
      priority: 15,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
    },
  })

  // HOT Vouchers - Numero Uno
  await prisma.merchantVoucher.upsert({
    where: { id: 'voucher-numero-uno-hot' },
    update: {
      storeId: 'numero-uno-oswiecenia',
      displayType: 'HOT',
      priority: 14,
      validUntil: new Date('2026-12-31'),
    },
    create: {
      id: 'voucher-numero-uno-hot',
      merchantId: numeroUno.id,
      storeId: 'numero-uno-oswiecenia',
      title: '🔥 Kup 1 pizzę, dostaniesz 2',
      description: 'Gorąca promocja! Druga pizza gratis',
      value: 50,
      pointsCost: 250,
      imageUrl: '/api/static/stores/numer_uno_krakow/vouchers/hot/hot_voucher.png',
      displayType: 'HOT',
      priority: 14,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
    },
  })

  // STANDARD Vouchers - Alanya Kebab
  await prisma.merchantVoucher.upsert({
    where: { id: 'voucher-alanya-kebab-standard' },
    update: {
      storeId: 'alanya-kebab-oswiecenia',
      displayType: 'STANDARD',
      priority: 3,
      validUntil: new Date('2026-12-31'),
    },
    create: {
      id: 'voucher-alanya-kebab-standard',
      merchantId: alanyaKebab.id,
      storeId: 'alanya-kebab-oswiecenia',
      title: '10% zniżki na kebab',
      description: 'Standardowa zniżka na wszystkie kebaby',
      value: 10,
      pointsCost: 50,
      imageUrl: '/api/static/stores/alayna_kebab_oswiecenia/vouchers/standard/standard_voucher.png',
      displayType: 'STANDARD',
      priority: 3,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
    },
  })

  // STANDARD Vouchers - Numero Uno
  await prisma.merchantVoucher.upsert({
    where: { id: 'voucher-numero-uno-standard' },
    update: {
      storeId: 'numero-uno-oswiecenia',
      displayType: 'STANDARD',
      priority: 2,
      validUntil: new Date('2026-12-31'),
    },
    create: {
      id: 'voucher-numero-uno-standard',
      merchantId: numeroUno.id,
      storeId: 'numero-uno-oswiecenia',
      title: '15% zniżki na pizzę',
      description: 'Standardowa zniżka na wszystkie pizze',
      value: 15,
      pointsCost: 80,
      imageUrl: '/api/static/stores/numer_uno_krakow/vouchers/standard/standard_voucher.png',
      displayType: 'STANDARD',
      priority: 2,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
    },
  })

  // Stores without images
  await prisma.merchantStore.upsert({
    where: { id: 'starbucks-serenada' },
    update: {
      address: 'ul. Serenady 1',
      description:
        'Kawiarnia Starbucks w Galerii Serenada to miejsce spotkań przy aromatycznej kawie. Szeroki wybór napojów, przekąsek i wygodne miejsca do pracy.',
    },
    create: {
      id: 'starbucks-serenada',
      merchantId: starbucks.id,
      name: 'Starbucks - Galera Serenada',
      address: 'ul. Serenady 1',
      description:
        'Kawiarnia Starbucks w Galerii Serenada to miejsce spotkań przy aromatycznej kawie. Szeroki wybór napojów, przekąsek i wygodne miejsca do pracy.',
      city: 'Kraków',
      country: 'Poland',
      postalCode: '31-509',
      phone: '+48 12 345 67 90',
      hours: '6:00 AM - 10:00 PM',
      latitude: 50.0885734,
      longitude: 19.9836001,
      logoUrl: '/api/static/logos/starbucks.png',
      photoUrl: '/api/static/logos/starbucks.png',
      categoryId: caffeCategory.id,
      images: [
        {
          url: '/api/static/stores/starbuck_galeria_krakowska/starbuck_krakowska_main.webp',
          type: 'main',
          alt: 'Store front',
        },
        {
          url: '/api/static/stores/starbuck_galeria_krakowska/starbucks_galeria_krakowska.webp',
          type: 'gallery',
          alt: 'Store view 2',
        },
        {
          url: '/api/static/stores/starbuck_galeria_krakowska/starbuck_krakowska_2.webp',
          type: 'gallery',
          alt: 'Store view 3',
        },
        {
          url: '/api/static/stores/starbuck_galeria_krakowska/starbuck_krakowska_polki.webp',
          type: 'gallery',
          alt: 'Store view 4',
        },
      ],
    },
  })

  await prisma.merchantStore.upsert({
    where: { id: 'starbucks-zlotetarasy' },
    update: {
      address: 'ul. Złota 59',
      description:
        'Starbucks w centrum Warszawy przy Złotych Tarasach. Idealna lokalizacja na kawę przed zakupami lub spotkanie biznesowe. Premium coffee experience.',
    },
    create: {
      id: 'starbucks-zlotetarasy',
      merchantId: starbucks.id,
      name: 'Starbucks - Złote Tarasy',
      address: 'ul. Złota 59',
      description:
        'Starbucks w centrum Warszawy przy Złotych Tarasach. Idealna lokalizacja na kawę przed zakupami lub spotkanie biznesowe. Premium coffee experience.',
      city: 'Warszawa',
      country: 'Poland',
      postalCode: '00-120',
      phone: '+48 22 123 45 67',
      hours: '7:00 AM - 11:00 PM',
      latitude: 52.231071,
      longitude: 20.9999026,
      logoUrl: '/api/static/logos/starbucks.png',
      photoUrl: '/api/static/logos/starbucks.png',
      categoryId: caffeCategory.id,
      images: [
        {
          url: '/api/static/stores/starbuck_galeria_krakowska/starbuck_krakowska_main.webp',
          type: 'main',
          alt: 'Store front',
        },
        {
          url: '/api/static/stores/starbuck_galeria_krakowska/starbucks_galeria_krakowska.webp',
          type: 'gallery',
          alt: 'Store view 2',
        },
        {
          url: '/api/static/stores/starbuck_galeria_krakowska/starbuck_krakowska_2.webp',
          type: 'gallery',
          alt: 'Store view 3',
        },
        {
          url: '/api/static/stores/starbuck_galeria_krakowska/starbuck_krakowska_polki.webp',
          type: 'gallery',
          alt: 'Store view 4',
        },
      ],
    },
  })

  await prisma.merchantStore.upsert({
    where: { id: 'mcdonalds-warszawa-centrum' },
    update: {
      address: 'ul. Marszałkowska 104/122',
      description:
        "McDonald's w centrum Warszawy czynny 24/7. Zawsze świeże burgery, frytki i napoje. Idealne miejsce na szybki posiłek o każdej porze dnia i nocy.",
    },
    create: {
      id: 'mcdonalds-warszawa-centrum',
      merchantId: mcdonalds.id,
      name: "McDonald's - Centrum Warszawa",
      address: 'ul. Marszałkowska 104/122',
      description:
        "McDonald's w centrum Warszawy czynny 24/7. Zawsze świeże burgery, frytki i napoje. Idealne miejsce na szybki posiłek o każdej porze dnia i nocy.",
      city: 'Warszawa',
      country: 'Poland',
      postalCode: '00-017',
      phone: '+48 22 987 65 43',
      hours: '24/7',
      latitude: 52.231087,
      longitude: 20.9921778,
      logoUrl: '/api/static/logos/mcdonalds.png',
      photoUrl: '/api/static/logos/mcdonalds.png',
      categoryId: fastFoodCategory.id,
      images: [
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow.webp',
          type: 'main',
          alt: 'Store front',
        },
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow2.webp',
          type: 'gallery',
          alt: 'Store view 2',
        },
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow3.webp',
          type: 'gallery',
          alt: 'Store view 3',
        },
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow4.webp',
          type: 'gallery',
          alt: 'Store view 4',
        },
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow5.webp',
          type: 'gallery',
          alt: 'Store view 5',
        },
      ],
    },
  })

  await prisma.merchantStore.upsert({
    where: { id: 'mcdonalds-krokus' },
    update: {
      address: 'ul. Krokusowa 1',
      description:
        "Restauracja McDonald's przy Galerii Krokus oferuje pełne menu, McCafé i wygodny parking. Rodzinne miejsce z placem zabaw dla dzieci.",
    },
    create: {
      id: 'mcdonalds-krokus',
      merchantId: mcdonalds.id,
      name: "McDonald's - Krokus",
      address: 'ul. Krokusowa 1',
      description:
        "Restauracja McDonald's przy Galerii Krokus oferuje pełne menu, McCafé i wygodny parking. Rodzinne miejsce z placem zabaw dla dzieci.",
      city: 'Kraków',
      country: 'Poland',
      postalCode: '31-509',
      phone: '+48 12 987 65 44',
      hours: '24/7',
      latitude: 50.0886025,
      longitude: 19.9655755,
      logoUrl: '/api/static/logos/mcdonalds.png',
      photoUrl: '/api/static/logos/mcdonalds.png',
      categoryId: fastFoodCategory.id,
      images: [
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow.webp',
          type: 'main',
          alt: 'Store front',
        },
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow2.webp',
          type: 'gallery',
          alt: 'Store view 2',
        },
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow3.webp',
          type: 'gallery',
          alt: 'Store view 3',
        },
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow4.webp',
          type: 'gallery',
          alt: 'Store view 4',
        },
        {
          url: '/api/static/stores/mcdonald_rynek_glowny_krakow/mcdonald_rynek_glowy_krakow5.webp',
          type: 'gallery',
          alt: 'Store view 5',
        },
      ],
    },
  })

  await prisma.merchantStore.upsert({
    where: { id: 'hermes-paris-oswiecenia' },
    update: {
      address: 'ul. Oświecenia 55',
      description:
        'Butik Hermès Paris oferuje ekskluzywne torebki, akcesoria i biżuterię najwyższej jakości. Luksusowe produkty, eleganckie wnętrze i profesjonalna obsługa dla wymagających klientów.',
    },
    create: {
      id: 'hermes-paris-oswiecenia',
      merchantId: hermesParis.id,
      name: 'Hermès Paris - Oświecenia',
      address: 'ul. Oświecenia 55',
      description:
        'Butik Hermès Paris oferuje ekskluzywne torebki, akcesoria i biżuterię najwyższej jakości. Luksusowe produkty, eleganckie wnętrze i profesjonalna obsługa dla wymagających klientów.',
      city: 'Kraków',
      country: 'Poland',
      postalCode: '31-050',
      phone: '+48 12 111 22 33',
      hours: '10:00 AM - 8:00 PM',
      latitude: 50.0841,
      longitude: 19.9455,
      logoUrl: '/api/static/logos/hermes.png',
      photoUrl: '/api/static/logos/hermes.png',
      categoryId: groceryCategory.id,
      images: [
        {
          url: '/api/static/stores/hermes_paris_oswiecenia/hermes_paris_oswiecenia.jpg',
          type: 'main',
          alt: 'Store front',
        },
      ],
    },
  })

  await prisma.merchantStore.upsert({
    where: { id: 'bonito-oswiecenia' },
    update: {
      address: 'Dobrego Pasterza 122',
      description:
        'Restauracja Bonito specjalizuje się w kuchni śródziemnomorskiej. Świeże owoce morza, aromatyczne przyprawy i wina z regionu. Romantyczna atmosfera i wykwintne dania.',
    },
    create: {
      id: 'bonito-oswiecenia',
      merchantId: bonito.id,
      name: 'Bonito - Oświecenia',
      address: 'Dobrego Pasterza 122',
      description:
        'Restauracja Bonito specjalizuje się w kuchni śródziemnomorskiej. Świeże owoce morza, aromatyczne przyprawy i wina z regionu. Romantyczna atmosfera i wykwintne dania.',
      city: 'Kraków',
      country: 'Poland',
      postalCode: '31-509',
      phone: '+48 12 222 33 44',
      hours: '12:00 PM - 11:00 PM',
      latitude: 50.08938,
      longitude: 19.9764863,
      logoUrl: '/api/static/logos/bonito.png',
      photoUrl: '/api/static/logos/bonito.png',
      categoryId: bookStoreCategory.id,
      images: [{ url: '/api/static/stores/bonito_oswiecenia/bonito_oswiecenia.jpg', type: 'main', alt: 'Store front' }],
    },
  })

  await prisma.merchantStore.upsert({
    where: { id: 'airbnb-oswiecenia' },
    update: {
      address: 'ul. Oświecenia 65',
      description:
        'Biuro Airbnb w Krakowie oferuje pomoc w znalezieniu idealnego noclegu. Profesjonalne doradztwo, weryfikowane oferty i wsparcie dla gospodarzy i gości.',
    },
    create: {
      id: 'airbnb-oswiecenia',
      merchantId: airbnb.id,
      name: 'Airbnb - Biuro Oświecenia',
      address: 'ul. Oświecenia 65',
      description:
        'Biuro Airbnb w Krakowie oferuje pomoc w znalezieniu idealnego noclegu. Profesjonalne doradztwo, weryfikowane oferty i wsparcie dla gospodarzy i gości.',
      city: 'Kraków',
      country: 'Poland',
      postalCode: '31-509',
      phone: '+48 12 222 33 55',
      hours: '9:00 AM - 6:00 PM',
      latitude: 50.090278,
      longitude: 19.9786206,
      logoUrl: '/api/static/logos/airbnb.png',
      photoUrl: '/api/static/logos/airbnb.png',
      categoryId: travelCategory.id,
      images: [],
    },
  })

  // ========== LOYALTY STAMPS ==========
  // Create stamp card template for Numero Uno with milestones
  const stampTemplate = await prisma.loyaltyStampCardTemplate.upsert({
    where: { id: 'numero-uno-stamps-template' },
    update: {
      stampCoverUrl: '/api/static/stores/numer_uno_krakow/stamps/stamp_card_cover.png',
      stampStickerIconUrl: '/api/static/stores/numer_uno_krakow/stamps/stamp_sticker_icon.png',
      rewardType: 'FREE_SERVICE',
      resetStampsOnMilestoneClaim: true,
    },
    create: {
      id: 'numero-uno-stamps-template',
      merchantId: numeroUno.id,
      title: 'Karta Pieczątek Numero Uno',
      description: 'Zbieraj pieczątki za każdy zakup pizzy',
      stampsRequired: 10,
      rewardType: 'FREE_SERVICE',
      rewardTitle: 'Darmowa pizza',
      rewardDescription: 'Darmowa pizza margherita po zebraniu 10 pieczątek',
      resetStampsOnMilestoneClaim: true,
      isActive: true,
      validFrom: new Date('2024-01-01'),
      validUntil: null,
      stampCoverUrl: '/api/static/stores/numer_uno_krakow/stamps/stamp_card_cover.png',
      stampStickerIconUrl: '/api/static/stores/numer_uno_krakow/stamps/stamp_sticker_icon.png',
    },
  })

  // Create milestones for the template
  await prisma.stampMilestone.upsert({
    where: { id: 'milestone-numero-uno-3' },
    update: {},
    create: {
      id: 'milestone-numero-uno-3',
      templateId: stampTemplate.id,
      stampsRequired: 3,
      milestoneType: 'DISCOUNT_PERCENT',
      discountPercent: 10,
      title: '10% zniżki',
      description: '10% zniżki na następny zakup',
      isActive: true,
    },
  })

  await prisma.stampMilestone.upsert({
    where: { id: 'milestone-numero-uno-6' },
    update: {},
    create: {
      id: 'milestone-numero-uno-6',
      templateId: stampTemplate.id,
      stampsRequired: 6,
      milestoneType: 'DISCOUNT_PERCENT',
      discountPercent: 20,
      title: '20% zniżki',
      description: '20% zniżki na następny zakup',
      isActive: true,
    },
  })

  await prisma.stampMilestone.upsert({
    where: { id: 'milestone-numero-uno-8' },
    update: {},
    create: {
      id: 'milestone-numero-uno-8',
      templateId: stampTemplate.id,
      stampsRequired: 8,
      milestoneType: 'FREE_SERVICE',
      title: 'Darmowa cola',
      description: 'Darmowa cola 0.5L',
      isActive: true,
    },
  })

  // ========== COUPONS - Owocowy Bazarek ==========
  // HOT Coupons
  await prisma.coupon.upsert({
    where: { id: 'coupon-owocowy-hot-1' },
    update: {},
    create: {
      id: 'coupon-owocowy-hot-1',
      code: 'OWOCE50',
      title: '🔥 50% zniżki na truskawki',
      description: 'Gorąca oferta! Świeże truskawki w super cenie',
      imageUrl: '/api/static/stores/owocowy_bazarek_marcholta_krakow/coupons/hot/strawberry_hot.png',
      couponType: 'DISCOUNT',
      availability: 'FREE',
      displayType: 'HOT',
      priority: 20,
      merchantId: owocowyBazarek.id,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      discountType: 'PERCENTAGE',
      discountValue: 50,
      isActive: true,
      currentUses: 0,
      isStackable: false,
    },
  })

  await prisma.coupon.upsert({
    where: { id: 'coupon-owocowy-hot-2' },
    update: {},
    create: {
      id: 'coupon-owocowy-hot-2',
      code: 'SMOOTHIE2FOR1',
      title: '🔥 Kup 1 smoothie, dostaniesz 2',
      description: 'Gorąca promocja! Drugie smoothie gratis',
      imageUrl: '/api/static/stores/owocowy_bazarek_marcholta_krakow/coupons/hot/smoothie_hot.png',
      couponType: 'MULTI_BUY',
      availability: 'FREE',
      displayType: 'HOT',
      priority: 19,
      merchantId: owocowyBazarek.id,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      buyQuantity: 1,
      getQuantity: 2,
      isActive: true,
      currentUses: 0,
      isStackable: false,
    },
  })

  // PROMOTED Coupons
  await prisma.coupon.upsert({
    where: { id: 'coupon-owocowy-promoted-1' },
    update: {},
    create: {
      id: 'coupon-owocowy-promoted-1',
      code: 'OWOCE30',
      title: '30% zniżki na owoce sezonowe',
      description: 'Promocja na wszystkie owoce sezonowe',
      imageUrl: '/api/static/stores/owocowy_bazarek_marcholta_krakow/coupons/promoted/seasonal_promoted.png',
      couponType: 'DISCOUNT',
      availability: 'POINTS',
      pointsCost: 100,
      displayType: 'PROMOTED',
      priority: 10,
      merchantId: owocowyBazarek.id,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      discountType: 'PERCENTAGE',
      discountValue: 30,
      isActive: true,
      currentUses: 0,
      isStackable: false,
    },
  })

  await prisma.coupon.upsert({
    where: { id: 'coupon-owocowy-promoted-2' },
    update: {},
    create: {
      id: 'coupon-owocowy-promoted-2',
      code: 'ZAKUPY50',
      title: '10zł zniżki przy zakupach powyżej 50zł',
      description: 'Zrób zakupy za minimum 50zł i otrzymaj 10zł rabatu',
      imageUrl: '/api/static/stores/owocowy_bazarek_marcholta_krakow/coupons/promoted/threshold_promoted.png',
      couponType: 'THRESHOLD_DISCOUNT',
      availability: 'FREE',
      displayType: 'PROMOTED',
      priority: 9,
      merchantId: owocowyBazarek.id,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      thresholdAmount: 50,
      discountAmount: 10,
      isActive: true,
      currentUses: 0,
      isStackable: false,
    },
  })

  // STANDARD Coupons
  await prisma.coupon.upsert({
    where: { id: 'coupon-owocowy-standard-1' },
    update: {},
    create: {
      id: 'coupon-owocowy-standard-1',
      code: 'BANAN15',
      title: '15% zniżki na banany',
      description: 'Standardowa zniżka na wszystkie banany',
      imageUrl: '/api/static/stores/owocowy_bazarek_marcholta_krakow/coupons/standard/banana_standard.png',
      couponType: 'ITEM_SPECIFIC',
      availability: 'FREE',
      displayType: 'STANDARD',
      priority: 3,
      merchantId: owocowyBazarek.id,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      itemName: 'Banany',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      isActive: true,
      currentUses: 0,
      isStackable: false,
    },
  })

  await prisma.coupon.upsert({
    where: { id: 'coupon-owocowy-standard-2' },
    update: {},
    create: {
      id: 'coupon-owocowy-standard-2',
      code: 'PONIEDZIALEK20',
      title: '20% zniżki w poniedziałki',
      description: 'Każdy poniedziałek z rabatem na wszystkie produkty',
      imageUrl: '/api/static/stores/owocowy_bazarek_marcholta_krakow/coupons/standard/monday_standard.png',
      couponType: 'DAY_OF_WEEK',
      availability: 'FREE',
      displayType: 'STANDARD',
      priority: 2,
      merchantId: owocowyBazarek.id,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      dayOfWeek: 'MONDAY',
      discountType: 'PERCENTAGE',
      discountValue: 20,
      isActive: true,
      currentUses: 0,
      isStackable: false,
    },
  })

  // Starbucks Coupons
  await prisma.coupon.upsert({
    where: { id: 'coupon-starbucks-hot-1' },
    update: {},
    create: {
      id: 'coupon-starbucks-hot-1',
      code: 'COFFEE40',
      title: '🔥 40% zniżki na kawę',
      description: 'Gorąca oferta na wszystkie kawy!',
      imageUrl: '/api/static/stores/starbuck_galeria_krakowska/coupons/hot/coffee_hot.png',
      couponType: 'DISCOUNT',
      availability: 'FREE',
      displayType: 'HOT',
      priority: 22,
      merchantId: starbucks.id,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      discountType: 'PERCENTAGE',
      discountValue: 40,
      isActive: true,
      currentUses: 0,
      isStackable: false,
    },
  })

  // McDonald's Coupons
  await prisma.coupon.upsert({
    where: { id: 'coupon-mcdonalds-promoted-1' },
    update: {},
    create: {
      id: 'coupon-mcdonalds-promoted-1',
      code: 'BIGMAC2FOR1',
      title: 'Kup 1 Big Mac, dostaniesz 2',
      description: 'Drugi Big Mac gratis!',
      imageUrl: '/api/static/stores/mcdonald_rynek_glowny_krakow/coupons/promoted/bigmac_promoted.png',
      couponType: 'MULTI_BUY',
      availability: 'FREE',
      displayType: 'PROMOTED',
      priority: 11,
      merchantId: mcdonalds.id,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      buyQuantity: 1,
      getQuantity: 2,
      isActive: true,
      currentUses: 0,
      isStackable: false,
    },
  })

  // Burger King Coupons
  await prisma.coupon.upsert({
    where: { id: 'coupon-burgerking-hot-1' },
    update: {},
    create: {
      id: 'coupon-burgerking-hot-1',
      code: 'WHOPPER50',
      title: '🔥 50% zniżki na Whopper',
      description: 'Mega promocja na Whoppera!',
      imageUrl: '/api/static/stores/burger_king_serenada/coupons/hot/whopper_hot.png',
      couponType: 'DISCOUNT',
      availability: 'FREE',
      displayType: 'HOT',
      priority: 21,
      merchantId: burgerKing.id,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      discountType: 'PERCENTAGE',
      discountValue: 50,
      isActive: true,
      currentUses: 0,
      isStackable: false,
    },
  })

  // Numero Uno Coupons
  await prisma.coupon.upsert({
    where: { id: 'coupon-numerouno-standard-1' },
    update: {},
    create: {
      id: 'coupon-numerouno-standard-1',
      code: 'PIZZA15',
      title: '15% zniżki na pizzę',
      description: 'Standardowa zniżka na wszystkie pizze',
      imageUrl: '/api/static/stores/numer_uno_krakow/coupons/standard/pizza_standard.png',
      couponType: 'DISCOUNT',
      availability: 'FREE',
      displayType: 'STANDARD',
      priority: 4,
      merchantId: numeroUno.id,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2026-12-31'),
      discountType: 'PERCENTAGE',
      discountValue: 15,
      isActive: true,
      currentUses: 0,
      isStackable: false,
    },
  })

  // Create stamp card for client@gmail.com for Numero Uno store with 6 stamps
  const existingCard = await prisma.loyaltyStampCard.findFirst({
    where: {
      userId: client.id,
      merchantId: numeroUno.id,
      isActive: true,
    },
  })

  const stampCard =
    existingCard ||
    (await prisma.loyaltyStampCard.create({
      data: {
        userId: client.id,
        merchantId: numeroUno.id,
        templateId: stampTemplate.id,
        stampsRequired: 10,
        stampsCollected: 6,
        stampsUsed: 0,
        isActive: true,
        validUntil: null,
      },
    }))

  // Add 6 individual stamps
  for (let i = 0; i < 6; i++) {
    await prisma.loyaltyStamp.upsert({
      where: { id: `stamp-numero-uno-${client.id}-${i}` },
      update: {},
      create: {
        id: `stamp-numero-uno-${client.id}-${i}`,
        cardId: stampCard.id,
        isUsed: false,
        metadata: { createdAt: new Date().toISOString() },
      },
    })
  }

  // Create stamp transactions for history
  await prisma.stampTransaction.upsert({
    where: { id: `stamp-tx-numero-uno-${client.id}` },
    update: {},
    create: {
      id: `stamp-tx-numero-uno-${client.id}`,
      userId: client.id,
      cardId: stampCard.id,
      type: 'EARNED',
      amount: 6,
      description: 'Zarobione pieczątki za zakupy',
      balanceBefore: 0,
      balanceAfter: 6,
      referenceId: 'initial-seed',
      referenceType: 'SEED_DATA',
    },
  })

  // ========== MERCHANT VOUCHERS ==========
  // Create merchant vouchers for Numero Uno
  await prisma.merchantVoucher.upsert({
    where: { id: 'voucher-numero-uno-standard' },
    update: {},
    create: {
      id: 'voucher-numero-uno-standard',
      merchantId: numeroUno.id,
      title: '15% zniżki na pizzę',
      description: 'Standardowa zniżka na wszystkie pizze',
      value: 15,
      pointsCost: 80,
      displayType: 'STANDARD',
      priority: 1,
      isActive: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
    },
  })

  await prisma.merchantVoucher.upsert({
    where: { id: 'voucher-numero-uno-pizza' },
    update: {},
    create: {
      id: 'voucher-numero-uno-pizza',
      merchantId: numeroUno.id,
      title: 'Darmowa pizza przy zamówieniu powyżej 50zł',
      description: 'Zamów za minimum 50zł i otrzymaj małą pizzę gratis',
      value: 25,
      pointsCost: 180,
      displayType: 'PROMOTED',
      priority: 2,
      isActive: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2024-12-31'),
    },
  })

  // ========== USER MERCHANT POINTS ==========
  // Add points for client at Numero Uno
  await prisma.userMerchantPointBalance.upsert({
    where: {
      userId_merchantId: {
        userId: client.id,
        merchantId: numeroUno.id,
      },
    },
    update: {},
    create: {
      userId: client.id,
      merchantId: numeroUno.id,
      totalPoints: 600,
      availablePoints: 600,
      lockedPoints: 0,
    },
  })

  // Add merchant point transaction
  await prisma.merchantPointTransaction.upsert({
    where: { id: `merchant-points-tx-${client.id}-${numeroUno.id}` },
    update: {},
    create: {
      id: `merchant-points-tx-${client.id}-${numeroUno.id}`,
      userId: client.id,
      merchantId: numeroUno.id,
      type: 'EARNED',
      amount: 600,
      description: 'Punkty startowe za rejestrację',
      balanceBefore: 0,
      balanceAfter: 600,
      referenceId: 'initial-seed',
      referenceType: 'SEED_DATA',
    },
  })

  console.log('✅ Seed completed!')
  console.log('- Client stamp card created: 6/10 stamps collected')
  console.log('- Available milestones: 3 stamps (10%), 6 stamps (20%)')
  console.log('- Client has 600 points at Numero Uno')
  console.log('- 2 merchant vouchers available at Numero Uno')
  console.log('- Bonito - Oświecenia: 50.08938, 19.9764863')

  // ========== ORDER SYSTEM ==========
  // Create order queue config for Numero Uno store
  await prisma.merchantStoreOrderQueueConfig.upsert({
    where: { merchantStoreId: 'numero-uno-oswiecenia' },
    update: {},
    create: {
      merchantStoreId: 'numero-uno-oswiecenia',
      orderArchiveDelayMs: 1800000, // 30 min
      maxActiveOrders: 500,
      webSessionTtlMs: 7200000, // 2 hours
      orderReadyPushTitle: 'Twoje zamówienie jest gotowe!',
      orderReadyPushBody: 'Zamówienie #{orderNumber} czeka na odbiór',
      orderNumberRolloverAfter: 100,
      autoPickUpAfterReady: true,
      orderReadyReminderEnabled: true,
      orderReadyReminderDelayMs: 900000, // 15 min
      requirePickupCode: true,
    },
  })

  // Create sample order for client@gmail.com
  const now = new Date()
  const orderDate = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Today at midnight local time

  const orderNumber = 45
  const pickupCode = `${orderNumber}${
    [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'J',
      'K',
      'L',
      'M',
      'N',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
    ][Math.floor(Math.random() * 24)]
  }${
    [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'J',
      'K',
      'L',
      'M',
      'N',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
    ][Math.floor(Math.random() * 24)]
  }`

  await prisma.order.upsert({
    where: { id: 'order-sample-client-45' },
    update: {},
    create: {
      id: 'order-sample-client-45',
      merchantStoreId: 'numero-uno-oswiecenia',
      orderNumber,
      status: 'READY',
      userId: client.id,
      sessionToken: null,
      phoneNumber: null,
      orderDate,
      pickupCode,
      readyAt: new Date(),
      note: 'Pizza Margherita + Cola',
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
    },
  })

  // Create order counter
  await prisma.orderCounter.upsert({
    where: {
      merchantStoreId_date: {
        merchantStoreId: 'numero-uno-oswiecenia',
        date: orderDate,
      },
    },
    update: { lastNumber: 45 },
    create: {
      merchantStoreId: 'numero-uno-oswiecenia',
      date: orderDate,
      lastNumber: 45,
    },
  })

  console.log('- Order #45 created for client@gmail.com (READY, pickup code: ' + pickupCode + ')')
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
