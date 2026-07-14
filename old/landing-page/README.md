# Bonapka Landing Page

## Wymagania

- Node.js + Yarn
- Dostęp SSH do serwera MyDevil skonfigurowany jako alias `mydevil` w `~/.ssh/config`

```
# ~/.ssh/config
Host mydevil
  HostName ssh.mydevil.net
  User <username>
  IdentityFile ~/.ssh/id_rsa
```

## Instalacja

```bash
yarn install
```

## Rozwój lokalny

```bash
yarn dev
```

## Deploy na MyDevil (easybons.com)

```bash
./mydevil_deploy.sh
```

Skrypt automatycznie:
1. Buduje aplikację (`yarn build`) — generuje katalog `out`
2. Kopiuje `out` na serwer do `~/domains/easybons.com/public_nodejs/frontend/`
3. Kopiuje `app.js` na serwer do `~/domains/easybons.com/public_nodejs/`
4. Tworzy dowiązanie symboliczne `public -> frontend/out`
5. Restartuje aplikację przez `devil www restart easybons.com`
