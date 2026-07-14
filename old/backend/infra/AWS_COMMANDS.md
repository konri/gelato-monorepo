# AWS CLI – przydatne komendy

## ECS

```bash
# Lista serwisów w klastrze
aws ecs list-services --cluster bonapka --region eu-central-1

# Status serwisu (running, desired, ostatnie zdarzenie)
aws ecs describe-services --cluster bonapka --services bonapka-backend-service --region eu-central-1 \
  --query "services[0].{Running:runningCount,Desired:desiredCount,LastEvent:events[0].message}" --output table

# Wymuś nowy deployment (np. po push nowego obrazu)
aws ecs update-service --cluster bonapka --service bonapka-backend-service --force-new-deployment --region eu-central-1

# Lista tasków w serwisie
aws ecs list-tasks --cluster bonapka --service-name bonapka-backend-service --region eu-central-1

# Szczegóły taska (status, powód zatrzymania)
aws ecs describe-tasks --cluster bonapka --tasks <TASK_ID> --region eu-central-1 \
  --query "tasks[0].{Status:lastStatus,StopReason:stoppedReason,Health:healthStatus}" --output table

# Publiczne IP taska (gdy brak ALB)
TASK_ARN=$(aws ecs list-tasks --cluster bonapka --service-name bonapka-backend-service --region eu-central-1 --query "taskArns[0]" --output text)
ENI=$(aws ecs describe-tasks --cluster bonapka --tasks $TASK_ARN --region eu-central-1 --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" --output text)
aws ec2 describe-network-interfaces --network-interface-ids $ENI --region eu-central-1 \
  --query "NetworkInterfaces[0].Association.PublicIp" --output text

# Zarejestruj nową wersję task definition
aws ecs register-task-definition --cli-input-json file://infra/ecs-task-definition.json --region eu-central-1
```

## CloudWatch Logs

```bash
# Streamuj logi na żywo (Ctrl+C żeby wyjść)
aws logs tail /ecs/bonapka-backend --follow --region eu-central-1

# Ostatnie 100 linii logów
aws logs tail /ecs/bonapka-backend --region eu-central-1
```

## ECR

```bash
# Lista obrazów w repozytorium
aws ecr list-images --repository-name bonapka-backend --region eu-central-1

# Zaloguj Docker do ECR
aws ecr get-login-password --region eu-central-1 | docker login --username AWS \
  --password-stdin 190275053744.dkr.ecr.eu-central-1.amazonaws.com
```

## Secrets Manager

```bash
# Lista sekretów
aws secretsmanager list-secrets --region eu-central-1 --query "SecretList[].Name" --output table

# Pobierz wartość sekretu
aws secretsmanager get-secret-value --secret-id bonapka/DATABASE_URL --region eu-central-1 --query SecretString --output text

# Utwórz nowy sekret
aws secretsmanager create-secret --name bonapka/NAZWA --secret-string "wartość" --region eu-central-1

# Zaktualizuj istniejący sekret
aws secretsmanager update-secret --secret-id bonapka/NAZWA --secret-string "nowa_wartość" --region eu-central-1
```

## RDS

```bash
# Status bazy
aws rds describe-db-instances --db-instance-identifier bonapka-db \
  --query 'DBInstances[0].DBInstanceStatus' --output text --region eu-central-1

# Endpoint bazy
aws rds describe-db-instances --db-instance-identifier bonapka-db \
  --query 'DBInstances[0].Endpoint.Address' --output text --region eu-central-1
```

## IAM

```bash
# Lista ról
aws iam list-roles --query "Roles[].RoleName" --output table

# Policy podpięte do roli
aws iam list-attached-role-policies --role-name ecsTaskExecutionRole --output table

# Podepnij policy do roli
aws iam attach-role-policy --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchLogsFullAccess
```

## Ogólne

```bash
# Sprawdź aktywne konto AWS
aws sts get-caller-identity

# Aktualny Account ID
aws sts get-caller-identity --query Account --output text
```
