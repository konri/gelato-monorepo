# Deploy na AWS Fargate – krok po kroku

## Wymagania wstępne

- AWS CLI v2 zainstalowane przez oficjalny installer (nie Homebrew)
- Docker Desktop uruchomiony
- Konto AWS z \$100 kredytu
- User IAM z politykami: `AmazonEC2ContainerRegistryFullAccess`, `AmazonRDSFullAccess`, `AmazonECS_FullAccess`, `SecretsManagerReadWrite`

---

## Struktura infra/

```
infra/
├── push-to-ecr.sh           # build + push obrazu Docker do ECR
├── setup-rds.sh             # tworzy RDS PostgreSQL db.t3.micro
├── setup-secrets.sh         # wrzuca sekrety do Secrets Manager
├── ecs-task-definition.json # template task definition dla Fargate
└── AWS_DEPLOY.md            # ten plik
```

---

## Krok 1 – Skonfiguruj AWS CLI

```bash
aws configure
# Access Key ID:     <z konsoli IAM>
# Secret Access Key: <z konsoli IAM>
# Default region:    eu-central-1
# Default output:    json
```

---

## Krok 2 – Postaw bazę danych (RDS PostgreSQL)

```bash
./infra/setup-rds.sh
```

Skrypt:

- tworzy `db.t3.micro` PostgreSQL 16 w domyślnym VPC
- generuje hasło i zapisuje je do Secrets Manager
- ustawia security group (port 5432 tylko z VPC)

Poczekaj ~10 min aż RDS będzie `available`:

```bash
aws rds describe-db-instances \
  --db-instance-identifier bonapka-db \
  --query 'DBInstances[0].DBInstanceStatus' \
  --output text --region eu-central-1
```

Pobierz endpoint:

```bash
aws rds describe-db-instances \
  --db-instance-identifier bonapka-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text --region eu-central-1
```

---

## Krok 3 – Ustaw sekrety

```bash
./infra/setup-secrets.sh <RDS_ENDPOINT>

# Przykład:
./infra/setup-secrets.sh bonapka-db.abc123.eu-central-1.rds.amazonaws.com
```

Pozostałe sekrety (Firebase, SendGrid itp.) dodaj ręcznie:

```bash
aws secretsmanager create-secret \
  --name "bonapka/FIREBASE_CONFIG" \
  --secret-string '{"type":"service_account",...}' \
  --region eu-central-1
```

---

## Krok 4 – Migracja bazy

```bash
DATABASE_URL="postgresql://bonapka_user:<haslo>@<endpoint>:5432/bonapka" \
  npx prisma migrate deploy
```

---

## Krok 5 – Build i push obrazu do ECR

```bash
# Pierwsze uruchomienie – tworzy repo ECR i pushuje
CREATE_REPO=1 ./infra/push-to-ecr.sh v1.0.0

# Kolejne deploye
./infra/push-to-ecr.sh v1.0.1
```

---

## Krok 6 – Zarejestruj task definition

```bash
# Podmień YOUR_ACCOUNT_ID
sed -i '' "s/YOUR_ACCOUNT_ID/$(aws sts get-caller-identity --query Account --output text)/g" \
  infra/ecs-task-definition.json

aws ecs register-task-definition \
  --cli-input-json file://infra/ecs-task-definition.json \
  --region eu-central-1
```

---

## Krok 7 – Utwórz klaster ECS

```bash
aws ecs create-cluster \
  --cluster-name bonapka \
  --capacity-providers FARGATE \
  --region eu-central-1
```

---

## Krok 8 – Utwórz serwis ECS (przez konsolę AWS)

1. ECS → Clusters → bonapka → Create Service
2. Launch type: FARGATE
3. Task definition: `bonapka-backend`
4. Desired tasks: `1`
5. Load balancer: Application Load Balancer (nowy)
   - Port 80 → container 5000
6. VPC: domyślny, subnety publiczne
7. Security group: port 80 otwarty na 0.0.0.0/0

Po utworzeniu ALB dostaniesz tymczasową domenę:
`bonapka-alb-123456.eu-central-1.elb.amazonaws.com`

---

## Krok 9 – Domena bonapka.pl

W Route 53 lub u rejestratora:

```
CNAME  api.bonapka.pl  →  bonapka-alb-123456.eu-central-1.elb.amazonaws.com
```

HTTPS przez AWS Certificate Manager (ACM) – certyfikat darmowy.

---

## Kolejne deploye (po pierwszym setupie)

```bash
# 1. Zbuduj i pushuj nowy obraz
./infra/push-to-ecr.sh latest

# 2. Wymuś nowy deployment
aws ecs update-service --cluster bonapka --service bonapka-backend-service --force-new-deployment --region eu-central-1

# 3. Obserwuj logi
aws logs tail /ecs/bonapka-backend --follow --region eu-central-1
```

---

## Szacunkowe koszty (eu-central-1, 1 task)

| Usługa                  | Koszt/mies. |
| ----------------------- | ----------- |
| Fargate 0.5 vCPU / 1 GB | ~\$15       |
| RDS db.t3.micro (20 GB) | ~\$15       |
| ALB                     | ~\$16       |
| ECR + CloudWatch Logs   | ~\$2        |
| Razem                   | ~\$48/mies. |

\$100 kredytu → ~2 miesiące pełnego stacku AWS.

---

## IAM Role – wymagane do działania ECS

Przed pierwszym deployem utwórz dwie role IAM:

### ecsTaskExecutionRole (dla ECS – pull image, logi, sekrety)

```bash
# Utwórz rolę
aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [{"Effect": "Allow","Principal": {"Service": "ecs-tasks.amazonaws.com"},"Action": "sts:AssumeRole"}]
}'

# Podepnij wymagane policy
aws iam attach-role-policy --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

aws iam attach-role-policy --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite

aws iam attach-role-policy --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
```

### ecsTaskRole (dla aplikacji – dostęp do zasobów AWS w runtime)

```bash
aws iam create-role --role-name ecsTaskRole --assume-role-policy-document '{
  "Version": "2012-10-17",
  "Statement": [{"Effect": "Allow","Principal": {"Service": "ecs-tasks.amazonaws.com"},"Action": "sts:AssumeRole"}]
}'
```

> Obie role są już wpisane w `ecs-task-definition.json`. Przy przenoszeniu na nowe konto podmień Account ID w ARN-ach.

---

## Sekrety w Secrets Manager

Wymagane sekrety (tworzone przez `setup-secrets.sh` + ręcznie):

| Nazwa                         | Opis                                     |
| ----------------------------- | ---------------------------------------- |
| `bonapka/DATABASE_URL`        | Connection string do RDS                 |
| `bonapka/JWT_SECRET`          | Klucz do podpisywania tokenów JWT        |
| `bonapka/BE_JWT`              | Klucz JWT dla passport-jwt               |
| `bonapka/SENTRY_DSN`          | DSN Sentry (wpisz `disabled` jeśli brak) |
| `bonapka/FACEBOOK_APP_ID`     | Facebook OAuth App ID                    |
| `bonapka/FACEBOOK_APP_SECRET` | Facebook OAuth App Secret                |
| `bonapka/FACEBOOK_CALLBACK`   | Facebook OAuth callback URL              |
| `bonapka/GOOGLE_APP_ID`       | Google OAuth App ID                      |
| `bonapka/GOOGLE_APP_SECRET`   | Google OAuth App Secret                  |
| `bonapka/GOOGLE_CALLBACK`     | Google OAuth callback URL                |
| `bonapka/SMTP_HOST`           | SMTP host do wysyłki maili               |
| `bonapka/SMTP_PORT`           | SMTP port                                |
| `bonapka/SMTP_USER`           | SMTP użytkownik                          |
| `bonapka/SMTP_PASS`           | SMTP hasło                               |
| `bonapka/SMTP_FROM`           | Adres nadawcy maili                      |
| `bonapka/REDIS_URL`           | URL do Redis (Upstash)                   |
| `bonapka/AWS_BUCKET_NAME`     | Nazwa bucketu S3                         |
| `bonapka/AWS_ACCESS_KEY_ID`   | AWS Access Key dla S3                    |
| `bonapka/AWS_SECRET_KEY`      | AWS Secret Key dla S3                    |
| `bonapka/BACKEND_HOST`        | URL backendu (reset hasła)               |
| `bonapka/BACKEND_ADDRESS`     | Bazowy URL backendu                      |

```bash
# Sentry DSN (jeśli nie używasz Sentry)
aws secretsmanager create-secret \
  --name bonapka/SENTRY_DSN \
  --secret-string "disabled" \
  --region eu-central-1
```

---

## Przeniesienie na konto startupowe AWS

Gdy dostaniesz kredyty z AWS Activate:

1. Utwórz role IAM (`ecsTaskExecutionRole`, `ecsTaskRole`) – patrz sekcja wyżej
2. Utwórz sekrety w Secrets Manager – patrz sekcja wyżej
3. Push nowego obrazu do ECR na nowym koncie: `CREATE_REPO=1 ./infra/push-to-ecr.sh latest`
4. Snapshot RDS → restore na nowym koncie
5. Zaktualizuj Account ID w `ecs-task-definition.json`
6. Zarejestruj task definition i utwórz serwis ECS (kroki 6-8)

---

## Połączenie z RDS przez DBeaver (lokalnie)

RDS domyślnie jest prywatne. Żeby połączyć się z DBeaver:

```bash
# Otwórz dostęp (wyświetli też dane do połączenia)
./infra/open-rds-access.sh open

# Po skończeniu zamknij
./infra/open-rds-access.sh close
```

Dane do DBeaver:

```
Host    : bonapka-db.cbqc002qwww8.eu-central-1.rds.amazonaws.com
Port    : 5432
Database: bonapka
User    : bonapka_user
Password: (skrypt wypisze przy open)
```

Pamiętaj zawsze zamknąć dostęp po skończeniu pracy.

---

## Migracje bazy (po zmianach w schema.prisma)

```bash
./infra/migrate-rds.sh
```

Skrypt automatycznie otwiera dostęp, odpala `prisma migrate deploy` i zamyka dostęp.

---

## Seed bazy

```bash
./infra/seed-rds.sh
```

Analogicznie – otwiera dostęp, odpala `prisma db seed` i zamyka.

---

## ElastiCache Redis

Redis na AWS ElastiCache (zamiast zewnętrznego Upstash).

```bash
# Stwórz subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name bonapka-redis-subnet \
  --cache-subnet-group-description "bonapka redis subnet" \
  --subnet-ids $(aws ec2 describe-subnets --region eu-central-1 --query "Subnets[*].SubnetId" --output text | tr '\t' ' ') \
  --region eu-central-1

# Stwórz klaster Redis
aws elasticache create-cache-cluster \
  --cache-cluster-id bonapka-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --cache-subnet-group-name bonapka-redis-subnet \
  --region eu-central-1

# Sprawdź status
aws elasticache describe-cache-clusters --cache-cluster-id bonapka-redis \
  --region eu-central-1 --query "CacheClusters[0].CacheClusterStatus" --output text

# Pobierz endpoint
aws elasticache describe-cache-clusters --cache-cluster-id bonapka-redis \
  --region eu-central-1 --show-cache-node-info \
  --query "CacheClusters[0].CacheNodes[0].Endpoint.Address" --output text
```

Zaktualizuj sekret z endpointem:

```bash
aws secretsmanager update-secret --secret-id bonapka/REDIS_URL \
  --secret-string "redis://bonapka-redis.svwhzi.0001.euc1.cache.amazonaws.com:6379" \
  --region eu-central-1
```

Otwórz port 6379 dla ECS:

```bash
DEFAULT_SG=$(aws ec2 describe-security-groups --region eu-central-1 \
  --filters "Name=group-name,Values=default" \
  --query "SecurityGroups[0].GroupId" --output text)

aws ec2 authorize-security-group-ingress --group-id $DEFAULT_SG \
  --protocol tcp --port 6379 --source-group sg-01d402ba134a71542 --region eu-central-1
```

Ustaw eviction policy na noeviction (wycisza ostrzeżenia BullMQ):

```bash
aws elasticache create-cache-parameter-group \
  --cache-parameter-group-name bonapka-redis-params \
  --cache-parameter-group-family redis7 \
  --description "bonapka redis params" --region eu-central-1

aws elasticache modify-cache-parameter-group \
  --cache-parameter-group-name bonapka-redis-params \
  --parameter-name-values ParameterName=maxmemory-policy,ParameterValue=noeviction \
  --region eu-central-1

aws elasticache modify-cache-cluster \
  --cache-cluster-id bonapka-redis \
  --cache-parameter-group-name bonapka-redis-params \
  --apply-immediately --region eu-central-1

aws elasticache reboot-cache-cluster \
  --cache-cluster-id bonapka-redis \
  --cache-node-ids-to-reboot 0001 --region eu-central-1
```

---

## Firebase Push Notifications

Sekrety wymagane w Secrets Manager:

| Nazwa                             | Opis                      |
| --------------------------------- | ------------------------- |
| `bonapka/FIREBASE_PROJECT_ID`     | ID projektu Firebase      |
| `bonapka/FIREBASE_CLIENT_EMAIL`   | Service account email     |
| `bonapka/FIREBASE_PRIVATE_KEY`    | Klucz prywatny (z JSON)   |
| `bonapka/FIREBASE_PRIVATE_KEY_ID` | ID klucza prywatnego      |
| `bonapka/FIREBASE_CLIENT_ID`      | Client ID service account |

Credentials pobierz z Firebase Console → Project Settings → Service Accounts → Generate new private key.

---

## GitHub Actions – automatyczny deploy

Push do brancha `main` automatycznie builduje obraz i deployuje na ECS.

Wymagane GitHub Secrets (repo → Settings → Secrets → Actions):

- `AWS_ACCESS_KEY_ID` – z IAM usera `bonapka-github-actions`
- `AWS_SECRET_ACCESS_KEY`

Stwórz usera:

```bash
aws iam create-user --user-name bonapka-github-actions
aws iam attach-user-policy --user-name bonapka-github-actions \
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess
aws iam attach-user-policy --user-name bonapka-github-actions \
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess
aws iam create-access-key --user-name bonapka-github-actions
```

Workflow: `.github/workflows/deploy-prod.yml`

---

## TODO

- [ ] Logowanie przez numer telefonu (Firebase Phone Auth)
- [ ] Testy GitHub Actions workflow (push do main)
