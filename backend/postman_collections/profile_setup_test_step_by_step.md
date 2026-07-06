# Profile Setup System - Test Curls (Krok po kroku)

## UWAGA: Przed testowaniem

1. Uruchom migrację: `yarn migrate-db-local` lub `yarn migrate-db-tunnel`
2. Zaloguj się i skopiuj JWT token z odpowiedzi
3. Zamień `YOUR_JWT_TOKEN` na prawdziwy token we wszystkich requestach

---

## KROK 1: Sprawdź początkowy status (nowy użytkownik bez company)

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "query { myProfileSetupStatus { currentStep completedSteps isCompleted hasCompany hasMerchant hasStore hasSubscription companyDraft merchantDraft storeDraft } }"
}'
```

**Oczekiwany wynik:**

```json
{
  "currentStep": "COMPANY_INFO",
  "completedSteps": [],
  "isCompleted": false,
  "hasCompany": false,
  "hasMerchant": false,
  "hasStore": false,
  "hasSubscription": false,
  "companyDraft": null,
  "merchantDraft": null,
  "storeDraft": null
}
```

---

## KROK 2: Zapisz draft formularza Company (częściowo wypełniony)

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "mutation SaveDraft($input: SaveFormDraftInput!) { saveFormDraft(input: $input) }",
    "variables": {
        "input": {
            "formType": "COMPANY",
            "formData": {
                "name": "Cofnij Cafe",
                "cityOperate": ["Warszawa", "Kraków"]
            },
            "step": "COMPANY_INFO"
        }
    }
}'
```

**Oczekiwany wynik:**

```json
{
  "data": {
    "saveFormDraft": true
  }
}
```

---

## KROK 3: Sprawdź status - draft powinien być zapisany

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "query { myProfileSetupStatus { currentStep companyDraft } }"
}'
```

**Oczekiwany wynik:**

```json
{
  "currentStep": "COMPANY_INFO",
  "companyDraft": {
    "name": "Cofnij Cafe",
    "cityOperate": ["Warszawa", "Kraków"]
  }
}
```

---

## KROK 4: Zaktualizuj draft (dodaj więcej danych)

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "mutation SaveDraft($input: SaveFormDraftInput!) { saveFormDraft(input: $input) }",
    "variables": {
        "input": {
            "formType": "COMPANY",
            "formData": {
                "name": "Cofnij Cafe",
                "description": "Najlepsza kawiarnia w mieście",
                "cityOperate": ["Warszawa", "Kraków", "Wrocław"],
                "phone": "+48123456789"
            },
            "step": "COMPANY_INFO"
        }
    }
}'
```

---

## KROK 5: Utwórz Company (prawdziwe dane w bazie)

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "mutation CreateCompany($data: CreateCompanyInput!) { createCompany(data: $data) { id name } }",
    "variables": {
        "data": {
            "name": "Cofnij Cafe",
            "description": "Najlepsza kawiarnia w mieście",
            "address": "ul. Marszałkowska 1",
            "city": "Warszawa",
            "country": "Poland",
            "cityOperate": ["Warszawa", "Kraków", "Wrocław"]
        }
    }
}'
```

---

## KROK 6: Wyczyść draft Company (już nie potrzebny)

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "mutation ClearDraft($formType: String!) { clearFormDraft(formType: $formType) }",
    "variables": {
        "formType": "COMPANY"
    }
}'
```

---

## KROK 7: Sprawdź status - powinien przejść do COMPANY_PHOTO

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "query { myProfileSetupStatus { currentStep completedSteps hasCompany companyDraft } }"
}'
```

**Oczekiwany wynik:**

```json
{
  "currentStep": "COMPANY_PHOTO",
  "completedSteps": ["COMPANY_INFO"],
  "hasCompany": true,
  "companyDraft": null
}
```

---

## KROK 8: Zapisz draft Merchant

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "mutation SaveDraft($input: SaveFormDraftInput!) { saveFormDraft(input: $input) }",
    "variables": {
        "input": {
            "formType": "MERCHANT",
            "formData": {
                "name": "Cofnij Cafe - Merchant",
                "description": "Krótki opis naszej kawiarni",
                "categoryId": "category-uuid-tutaj"
            },
            "step": "MERCHANT_INFO"
        }
    }
}'
```

---

## KROK 9: Zapisz draft Store

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "mutation SaveDraft($input: SaveFormDraftInput!) { saveFormDraft(input: $input) }",
    "variables": {
        "input": {
            "formType": "MERCHANT_STORE",
            "formData": {
                "name": "Cofnij - Centrum",
                "address": "ul. Marszałkowska 1",
                "city": "Warszawa",
                "postalCode": "00-001",
                "phone": "+48123456789",
                "latitude": 52.2297,
                "longitude": 21.0122
            },
            "step": "MERCHANT_LOCATION"
        }
    }
}'
```

---

## KROK 10: Sprawdź wszystkie drafty naraz

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "query { myProfileSetupStatus { currentStep completedSteps hasCompany hasMerchant hasStore companyDraft merchantDraft storeDraft } }"
}'
```

**Oczekiwany wynik:**

```json
{
  "currentStep": "COMPANY_PHOTO",
  "completedSteps": ["COMPANY_INFO"],
  "hasCompany": true,
  "hasMerchant": false,
  "hasStore": false,
  "companyDraft": null,
  "merchantDraft": {
    "name": "Cofnij Cafe - Merchant",
    "description": "Krótki opis naszej kawiarni",
    "categoryId": "category-uuid-tutaj"
  },
  "storeDraft": {
    "name": "Cofnij - Centrum",
    "address": "ul. Marszałkowska 1",
    "city": "Warszawa",
    "postalCode": "00-001",
    "phone": "+48123456789",
    "latitude": 52.2297,
    "longitude": 21.0122
  }
}
```

---

## KROK 11: Wyczyść wszystkie drafty

```bash
# Wyczyść Merchant draft
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "mutation { clearFormDraft(formType: \"MERCHANT\") }"
}'

# Wyczyść Store draft
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "mutation { clearFormDraft(formType: \"MERCHANT_STORE\") }"
}'
```

---

## KROK 12: Finalne sprawdzenie - wszystkie drafty wyczyszczone

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "query { myProfileSetupStatus { currentStep completedSteps isCompleted hasCompany hasMerchant hasStore hasSubscription companyDraft merchantDraft storeDraft } }"
}'
```

---

## Scenariusz testowy - Symulacja przerwanego wypełniania

### 1. Użytkownik zaczyna wypełniać Company

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "mutation { saveFormDraft(input: { formType: \"COMPANY\", formData: { name: \"Test\" }, step: COMPANY_INFO }) }"
}'
```

### 2. Użytkownik zamyka aplikację (draft zapisany)

### 3. Użytkownik wraca - draft jest przywrócony

```bash
curl --location '{{base_url}}/graphql' \
--header 'Content-Type: application/json' \
--header 'Authorization: Bearer YOUR_JWT_TOKEN' \
--data '{
    "query": "query { myProfileSetupStatus { companyDraft } }"
}'
```

**Wynik:** `{ "companyDraft": { "name": "Test" } }`

---

## Notatki:

- Wszystkie drafty są per użytkownik
- Jeden draft per typ formularza (nadpisywanie)
- System automatycznie wykrywa currentStep na podstawie danych w bazie
- Drafty są niezależne od prawdziwych danych w bazie
