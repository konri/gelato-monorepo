# Profile Setup Progress System

## Przegląd

System automatycznego śledzenia postępu wypełniania profilu firmy z zapisywaniem częściowych danych formularzy (drafts). **Drafty są automatycznie czyszczone po zapisaniu prawdziwych danych.**

## Funkcjonalność

### 1. Automatyczne wykrywanie kroku

System automatycznie wykrywa na jakim etapie konfiguracji jest użytkownik:

- **COMPANY** - brak company (hasCompany = false)
- **MERCHANT** - company istnieje, brak merchant (hasMerchant = false)
- **STORE** - merchant istnieje, brak store (hasStore = false)
- **SUBSCRIPTION** - store istnieje, brak subskrypcji (hasSubscription = false)
- **COMPLETED** - wszystko ukończone

### 2. Zapisywanie drafts

Użytkownik może zapisywać częściowo wypełnione formularze:

- Jeden draft per typ formularza (COMPANY, MERCHANT, MERCHANT_STORE)
- Automatyczne nadpisywanie przy kolejnym zapisie
- **Automatyczne czyszczenie po zapisaniu prawdziwych danych**
- Dane w formacie JSON - elastyczne

### 3. Jedno zapytanie zamiast wielu

Zamiast:

```graphql
query {
  me { company { ... } }
  myCompany { merchant { ... } }
  myMerchant { stores { ... } }
  mySubscription { ... }
}
```

Teraz:

```graphql
query {
  myProfileSetupStatus {
    currentStep
    completedSteps
    isCompleted
    hasCompany
    hasMerchant
    hasStore
    hasSubscription
    companyDraft
    merchantDraft
    storeDraft
  }
}
```

## Kroki konfiguracji

```
1. COMPANY       → hasCompany
2. MERCHANT      → hasMerchant
3. STORE         → hasStore
4. SUBSCRIPTION  → hasSubscription
5. COMPLETED     → Gotowe!
```

## API

### Query: myProfileSetupStatus

Zwraca kompletny stan konfiguracji profilu.

**Response:**

```typescript
{
  currentStep: ProfileSetupStep        // Aktualny krok
  completedSteps: ProfileSetupStep[]   // Ukończone kroki
  isCompleted: boolean                 // Czy wszystko gotowe
  hasCompany: boolean                  // Czy ma company
  hasMerchant: boolean                 // Czy ma merchant
  hasStore: boolean                    // Czy ma store
  hasSubscription: boolean             // Czy ma subskrypcję
  companyDraft?: JSON                  // Draft formularza company
  merchantDraft?: JSON                 // Draft formularza merchant
  storeDraft?: JSON                    // Draft formularza store
}
```

### Mutation: saveFormDraft

Zapisuje częściowo wypełniony formularz. **Draft jest automatycznie usuwany po zapisaniu prawdziwych danych.**

**Input:**

```typescript
{
  formType: "COMPANY" | "MERCHANT" | "MERCHANT_STORE" | "SUBSCRIPTION"
  formData: JSON                       // Dowolne dane formularza
  step?: ProfileSetupStep              // Opcjonalny krok
}
```

**Example:**

```graphql
mutation {
  saveFormDraft(input: { formType: "COMPANY", formData: { name: "Cofnij", cityOperate: ["Warszawa"] }, step: COMPANY })
}
```

### Mutation: clearFormDraft

Usuwa zapisany draft. **Uwaga: Nie musisz tego wywoływać ręcznie - drafty są automatycznie czyszczone po zapisaniu prawdziwych danych (createCompanyAndMakeUserOwner, createMyMerchant, createMerchantStore).**

**Input:**

```typescript
{
  formType: 'COMPANY' | 'MERCHANT' | 'MERCHANT_STORE' | 'SUBSCRIPTION'
}
```

## Użycie w aplikacji mobilnej

### 1. Sprawdź status przy starcie

```typescript
const { data } = await client.query({
  query: GET_PROFILE_SETUP_STATUS,
})

// Przekieruj na odpowiedni ekran
if (data.myProfileSetupStatus.currentStep === 'COMPANY') {
  navigation.navigate('CompanyScreen')
} else if (data.myProfileSetupStatus.currentStep === 'MERCHANT') {
  navigation.navigate('MerchantScreen')
} else if (data.myProfileSetupStatus.currentStep === 'STORE') {
  navigation.navigate('StoreScreen')
}
// ... itd
```

### 2. Zapisuj draft przy każdej zmianie

```typescript
const handleFormChange = async (formData: any) => {
  await client.mutate({
    mutation: SAVE_FORM_DRAFT,
    variables: {
      input: {
        formType: 'COMPANY',
        formData: formData,
        step: 'COMPANY',
      },
    },
  })
}
```

### 3. Przywróć draft przy powrocie

```typescript
const { data } = await client.query({
  query: GET_PROFILE_SETUP_STATUS,
})

if (data.myProfileSetupStatus.companyDraft) {
  setFormData(data.myProfileSetupStatus.companyDraft)
}
```

### 4. Wyczyść draft po zapisaniu

```typescript
const handleSubmit = async () => {
  // Zapisz company
  await createCompanyAndMakeUserOwner(formData)

  // Draft jest automatycznie wyczyszczony!
  // Nie musisz wywoływać clearFormDraft

  // Przejdź dalej
  navigation.navigate('MerchantScreen')
}
```

## Database Schema

### ProfileSetupProgress

```prisma
model ProfileSetupProgress {
  id             String           @id @default(uuid())
  userId         String           @unique
  currentStep    ProfileSetupStep @default(COMPANY_INFO)
  completedSteps ProfileSetupStep[]
  isCompleted    Boolean          @default(false)
  lastActiveStep ProfileSetupStep?
  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt
}
```

### FormDraft

```prisma
model FormDraft {
  id        String           @id @default(uuid())
  userId    String
  formType  FormType
  formData  Json
  step      ProfileSetupStep?
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  @@unique([userId, formType])
}
```

## Korzyści

1. **Jedno zapytanie** - zamiast 4-5 zapytań, jedno zwraca wszystko
2. **Automatyczne wykrywanie** - nie trzeba ręcznie sprawdzać każdego kroku
3. **Zapisywanie drafts** - użytkownik nie traci danych przy przerwie
4. **Automatyczne czyszczenie** - drafty znikają po zapisaniu prawdziwych danych
5. **Elastyczne dane** - JSON pozwala na dowolną strukturę formularza
6. **Prostsza logika** - frontend dostaje gotowy `currentStep`

## Przykładowy flow

```
1. User loguje się → GET myProfileSetupStatus
   → currentStep: COMPANY
   → companyDraft: null

2. User wypełnia formularz → SAVE saveFormDraft
   → formType: COMPANY
   → formData: { name: "Cofnij", ... }

3. User zamyka app → dane zapisane

4. User wraca → GET myProfileSetupStatus
   → currentStep: COMPANY
   → companyDraft: { name: "Cofnij", ... }
   → formularz przywrócony!

5. User kończy formularz → CREATE createCompanyAndMakeUserOwner
   → Draft automatycznie wyczyszczony!

6. User sprawdza status → GET myProfileSetupStatus
   → currentStep: MERCHANT
   → hasCompany: true
   → companyDraft: null (automatycznie wyczyszczony)
```
