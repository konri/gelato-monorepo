-- Update addresses (remove postal codes and cities) and add descriptions
UPDATE "MerchantStore" SET 
  address = 'ul. Pawia 5',
  description = 'Nasza kawiarnia w Galerii Krakowskiej oferuje szeroki wybór kaw specialty, herbat oraz świeżych wypieków. Przyjazna atmosfera i wygodne miejsce na spotkania w centrum handlowym.'
WHERE id = 'starbucks-krakowska';

UPDATE "MerchantStore" SET 
  address = 'Rynek Główny 1',
  description = 'Restauracja fast food w sercu Krakowa na Rynku Głównym. Oferujemy klasyczne burgery, frytki i napoje. Szybka obsługa i świeże produkty codziennie.'
WHERE id = 'mcdonalds-rynek-glowny';

UPDATE "MerchantStore" SET 
  address = 'ul. Serenady 15',
  description = 'Burger King w Galerii Serenada zaprasza na flame-grilled burgery, crispy frytki i pyszne desery. Idealne miejsce na szybki posiłek podczas zakupów.'
WHERE id = 'burger-king-serenada';

UPDATE "MerchantStore" SET 
  address = 'ul. Oświecenia 35',
  description = 'Autentyczna włoska pizzeria serwująca pizzę na cienkim cieście z piekarnika opalanego drewnem. Świeże składniki, tradycyjne receptury i rodzinna atmosfera.'
WHERE id = 'numero-uno-oswiecenia';

UPDATE "MerchantStore" SET 
  address = 'ul. Oświecenia 45',
  description = 'Prawdziwy turecki kebab przygotowywany według oryginalnych receptur. Świeże mięso, aromatyczne przyprawy i domowe sosy. Szybka obsługa i przystępne ceny.'
WHERE id = 'alanya-kebab-oswiecenia';

UPDATE "MerchantStore" SET 
  address = 'ul. Bohomolca 12',
  description: 'Restauracja sushi oferująca świeże ryby, kreatywne zestawy i tradycyjne japońskie dania. Doświadczeni sushi masterzy i eleganckie wnętrze.'
WHERE id = 'point-sushi-bohomolca';

UPDATE "MerchantStore" SET 
  address = 'ul. Marcholta 8',
  description = 'Sklep ze świeżymi owocami i warzywami prosto od lokalnych dostawców. Sezonowe produkty, ekologiczne opcje i przyjazna obsługa. Codziennie świeże dostawy.'
WHERE id = 'owocowy-bazarek-marcholta';

UPDATE "MerchantStore" SET 
  address = 'ul. Serenady 1',
  description = 'Kawiarnia Starbucks w Galerii Serenada to miejsce spotkań przy aromatycznej kawie. Szeroki wybór napojów, przekąsek i wygodne miejsca do pracy.'
WHERE id = 'starbucks-serenada';

UPDATE "MerchantStore" SET 
  address = 'ul. Złota 59',
  description: 'Starbucks w centrum Warszawy przy Złotych Tarasach. Idealna lokalizacja na kawę przed zakupami lub spotkanie biznesowe. Premium coffee experience.'
WHERE id = 'starbucks-zlotetarasy';

UPDATE "MerchantStore" SET 
  address = 'ul. Marszałkowska 104/122',
  description: 'McDonald\'s w centrum Warszawy czynny 24/7. Zawsze świeże burgery, frytki i napoje. Idealne miejsce na szybki posiłek o każdej porze dnia i nocy.'
WHERE id = 'mcdonalds-warszawa-centrum';

UPDATE "MerchantStore" SET 
  address = 'ul. Krokusowa 1',
  description: 'Restauracja McDonald\'s przy Galerii Krokus oferuje pełne menu, McCafé i wygodny parking. Rodzinne miejsce z placem zabaw dla dzieci.'
WHERE id = 'mcdonalds-krokus';

UPDATE "MerchantStore" SET 
  address = 'ul. Oświecenia 55',
  description = 'Butik Hermès Paris oferuje ekskluzywne torebki, akcesoria i biżuterię najwyższej jakości. Luksusowe produkty, eleganckie wnętrze i profesjonalna obsługa dla wymagających klientów.'
WHERE id = 'hermes-paris-oswiecenia';

UPDATE "MerchantStore" SET 
  address = 'Dobrego Pasterza 122',
  description: 'Restauracja Bonito specjalizuje się w kuchni śródziemnomorskiej. Świeże owoce morza, aromatyczne przyprawy i wina z regionu. Romantyczna atmosfera i wykwintne dania.'
WHERE id = 'bonito-oswiecenia';

UPDATE "MerchantStore" SET 
  address: 'ul. Oświecenia 65',
  description: 'Biuro Airbnb w Krakowie oferuje pomoc w znalezieniu idealnego noclegu. Profesjonalne doradztwo, weryfikowane oferty i wsparcie dla gospodarzy i gości.'
WHERE id = 'airbnb-oswiecenia';
