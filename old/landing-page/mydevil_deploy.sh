#!/bin/bash

# Budowanie aplikacji lokalnie
echo "Budowanie aplikacji..."
yarn build

# Sprawdź, czy katalog out istnieje
if [ ! -d "out" ]; then
  echo "BŁĄD: Katalog out nie został wygenerowany!"
  exit 1
fi

# Kopiowanie plików na serwer
echo "Kopiowanie plików na serwer..."
scp -r out mydevil:~/domains/easybons.com/public_nodejs/frontend/
scp app.js mydevil:~/domains/easybons.com/public_nodejs/

# Tworzenie dowiązania symbolicznego
echo "Tworzenie dowiązania symbolicznego..."
ssh mydevil "rm -rf ~/domains/easybons.com/public_nodejs/public && ln -sf ~/domains/easybons.com/public_nodejs/frontend/out ~/domains/easybons.com/public_nodejs/public"

# Restart aplikacji
echo "Restart aplikacji..."
ssh mydevil "devil www restart easybons.com"

echo "Wdrożenie zakończone!"
echo "Strona powinna być dostępna pod adresem https://easybons.com"