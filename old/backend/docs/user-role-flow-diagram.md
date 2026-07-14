# EasyBons - User Role Flow Diagram

## System Architecture Overview

```mermaid
graph TB
    subgraph Applications
        MA[Mobile App - CLIENT Context]
        WA[Web App - OWNER/COOPERATOR Context]
    end

    subgraph UserSystem[User Account System]
        UA[Single User Account - Multiple Roles]
    end

    MA --> UA
    WA --> UA
```

## Registration Sources & Role Evolution

```mermaid
flowchart TD
    subgraph Sources[Registration Sources]
        RS1[WEB_MERCHANT]
        RS2[MOBILE_CLIENT]
        RS3[WEB_CLIENT]
    end

    subgraph Initial[Initial State]
        NU[NEW_USER - Temporary State]
    end

    subgraph Final[Final Roles]
        CLIENT[CLIENT - Mobile Consumer]
        OWNER[OWNER - Business Owner]
        COOP[COOPERATOR - Team Member]
    end

    RS1 --> NU
    RS2 --> NU
    RS3 --> NU

    NU -->|Email Verification + Company Data| OWNER
    NU -->|Email Verification Only| CLIENT
    OWNER -.->|Can also be| CLIENT
    COOP -.->|Can also be| CLIENT
```

## Complete Registration Flow

```mermaid
flowchart TD
    START([User wants to register])

    subgraph Method[Registration Method]
        EMAIL[Email Registration]
        OAUTH[OAuth - Google/Facebook/Apple]
    end

    subgraph Source[Source Detection]
        WM[Web Merchant - WEB_MERCHANT]
        MC[Mobile Client - MOBILE_CLIENT]
    end

    subgraph Creation[Account Creation]
        CREATE[Create Account - role NEW_USER + registrationSource]
    end

    subgraph EmailCheck[Email Check]
        CHECK{Email exists?}
        EXISTING[Existing User Found]
        NEW[New User]
    end

    subgraph ExistingFlow[Existing User Handling]
        ISCLIENT{role = CLIENT?}
        ISNEW{role = NEW_USER?}
        ISOWNER{role = OWNER?}

        REDIRECT_BUSINESS[Redirect to Complete Business Registration]
        REDIRECT_COMPLETE[Redirect to Complete Registration]
        REDIRECT_LOGIN[Redirect to Login - Already has access]
    end

    subgraph NewFlow[New User Flow]
        COMPANY_DATA{Needs Company Data?}
        FILL_COMPANY[Fill Company Data - NIP/REGON + GUS API]
        EMAIL_VERIFY[Email Verification]

        ASSIGN_OWNER[Assign OWNER Role]
        ASSIGN_CLIENT[Assign CLIENT Role]
    end

    START --> EMAIL
    START --> OAUTH

    EMAIL --> WM
    EMAIL --> MC
    OAUTH --> WM
    OAUTH --> MC

    WM --> CHECK
    MC --> CHECK

    CHECK -->|Yes| EXISTING
    CHECK -->|No| NEW

    EXISTING --> ISCLIENT
    EXISTING --> ISNEW
    EXISTING --> ISOWNER

    ISCLIENT -->|From WEB_MERCHANT| REDIRECT_BUSINESS
    ISNEW --> REDIRECT_COMPLETE
    ISOWNER --> REDIRECT_LOGIN

    NEW --> CREATE
    CREATE --> COMPANY_DATA

    COMPANY_DATA -->|WEB_MERCHANT| FILL_COMPANY
    COMPANY_DATA -->|MOBILE_CLIENT| EMAIL_VERIFY

    FILL_COMPANY --> EMAIL_VERIFY
    EMAIL_VERIFY -->|Had Company Data| ASSIGN_OWNER
    EMAIL_VERIFY -->|No Company Data| ASSIGN_CLIENT
```

## COOPERATOR Invitation Flow

```mermaid
sequenceDiagram
    participant O as OWNER
    participant B as Backend
    participant E as Email Service
    participant C as COOPERATOR
    participant DB as Database

    O->>B: Send invitation to email
    B->>DB: Create invite record (status: pending)
    B->>B: Generate token with expiry
    B->>E: Send invitation email
    E->>C: Email with invitation link

    alt User has no account
        C->>B: Click link + Register
        B->>DB: Create user account
    else User has account
        C->>B: Click link (already logged in)
    end

    C->>B: Accept invitation
    B->>DB: Update invite (status: accepted)
    B->>DB: Create user_company_roles (COOPERATOR, active)

    alt User rejects
        C->>B: Reject invitation
        B->>DB: Update invite (status: rejected)
    end

    Note over C,B: COOPERATOR can also login directly<br/>and see active invitations
```

## Role Combinations Matrix

```mermaid
graph LR
    subgraph Combinations[Possible Role Combinations]
        U1[User - CLIENT only]
        U2[User - OWNER only]
        U3[User - COOPERATOR only]
        U4[User - CLIENT + OWNER]
        U5[User - CLIENT + COOPERATOR]
        U6[User - OWNER + COOPERATOR - Not possible Same company]
        U7[User - CLIENT + OWNER + COOPERATOR - Not possible Same company]
    end

    subgraph Access[Access Rights]
        MA[Mobile App Access]
        WA[Web App Access]
    end

    U1 --> MA
    U2 --> WA
    U3 --> WA
    U4 --> MA
    U4 --> WA
    U5 --> MA
    U5 --> WA

    style U6 fill:#ffcccc
    style U7 fill:#ffcccc
```

## Data Model Overview

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string role "NEW_USER|CLIENT|OWNER|COOPERATOR"
        string registrationSource "WEB_MERCHANT|MOBILE_CLIENT|WEB_CLIENT"
        boolean emailVerified
        datetime createdAt
    }

    Company {
        string id PK
        string name
        string nip
        string regon
        json gusData "Auto-filled from API"
        string contactEmail "Editable"
        string contactPhone "Editable"
    }

    UserCompanyRoles {
        string userId FK
        string companyId FK
        string role "OWNER|COOPERATOR"
        string status "active|inactive"
    }

    Invites {
        string id PK
        string companyId FK
        string email
        string token
        string status "pending|accepted|rejected"
        datetime expiresAt
    }

    User ||--o{ UserCompanyRoles : "can have multiple company roles"
    Company ||--o{ UserCompanyRoles : "can have multiple users"
    Company ||--o{ Invites : "can send invitations"
```

## Key Benefits Summary

```mermaid
graph TD
    subgraph Benefits[Key Benefits]
        SA[Single Account]
        CS[Context Separation]
        FR[Flexible Roles]
        SR[Smart Registration]
        SEC[Security]
    end

    subgraph SADetails[Single Account Benefits]
        SA1[No multiple logins]
        SA2[Unified experience]
        SA3[Data consistency]
    end

    subgraph CSDetails[Context Separation Benefits]
        CS1[Mobile = Consumer]
        CS2[Web = Business]
        CS3[Natural UX]
    end

    subgraph FRDetails[Flexible Roles Benefits]
        FR1[Role evolution]
        FR2[Multiple roles per user]
        FR3[Business growth support]
    end

    subgraph SRDetails[Smart Registration Benefits]
        SR1[Source tracking]
        SR2[Existing user detection]
        SR3[Seamless upgrades]
    end

    subgraph SECDetails[Security Benefits]
        SEC1[Email verification]
        SEC2[Token-based invites]
        SEC3[Role-based access]
    end

    SA --> SA1
    SA --> SA2
    SA --> SA3

    CS --> CS1
    CS --> CS2
    CS --> CS3

    FR --> FR1
    FR --> FR2
    FR --> FR3

    SR --> SR1
    SR --> SR2
    SR --> SR3

    SEC --> SEC1
    SEC --> SEC2
    SEC --> SEC3
```
