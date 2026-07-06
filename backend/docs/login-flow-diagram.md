# EasyBons - Login Flow Decision Tree

## Login Flow - Role Assignment Logic

```mermaid
flowchart TD
    START([User attempts login])

    subgraph LoginMethod[Login Method]
        EMAIL_LOGIN[Email + Password]
        OAUTH_LOGIN[OAuth - Google/Facebook/Apple]
    end

    subgraph AppContext[Application Context]
        WEB_MERCHANT[Web Merchant App]
        MOBILE_CLIENT[Mobile Client App]
    end

    subgraph UserCheck[User Account Check]
        USER_EXISTS{User exists?}
        NO_USER[Show registration form]
        YES_USER[User found - check current role]
    end

    subgraph RoleCheck[Current Role Analysis]
        CHECK_ROLE{What is current role?}

        NEW_USER_ROLE[Role: NEW_USER]
        CLIENT_ROLE[Role: CLIENT]
        OWNER_ROLE[Role: OWNER]
        COOPERATOR_ROLE[Role: COOPERATOR]
    end

    subgraph NewUserFlow[NEW_USER Flow]
        CHECK_SOURCE{Check registrationSource}

        WEB_SOURCE[registrationSource: WEB_MERCHANT]
        MOBILE_SOURCE[registrationSource: MOBILE_CLIENT]

        NEED_COMPANY[Show: Complete company registration]
        NEED_EMAIL[Show: Verify your email]

        COMPANY_DONE{Company data filled?}
        EMAIL_VERIFIED{Email verified?}

        BECOME_OWNER[Grant OWNER role + login]
        BECOME_CLIENT[Grant CLIENT role + login]
    end

    subgraph ClientFlow[CLIENT Role Flow]
        CLIENT_APP{Logging into which app?}

        CLIENT_TO_MOBILE[Mobile App - Allow login as CLIENT]
        CLIENT_TO_WEB[Web App - Show: Want to become business partner?]

        UPGRADE_BUSINESS[Complete business registration]
        ADD_OWNER[Add OWNER role - keep CLIENT]
    end

    subgraph OwnerFlow[OWNER Role Flow]
        OWNER_APP{Logging into which app?}

        OWNER_TO_WEB[Web App - Allow login as OWNER]
        OWNER_TO_MOBILE[Mobile App - Auto grant CLIENT role + login]

        AUTO_CLIENT[Auto add CLIENT role]
    end

    subgraph CooperatorFlow[COOPERATOR Role Flow]
        COOP_APP{Logging into which app?}

        COOP_TO_WEB[Web App - Allow login as COOPERATOR]
        COOP_TO_MOBILE[Mobile App - Auto grant CLIENT role + login]

        AUTO_CLIENT_COOP[Auto add CLIENT role]
    end

    subgraph LoginSuccess[Login Success]
        SUCCESS_MOBILE[Login to Mobile App as CLIENT]
        SUCCESS_WEB_OWNER[Login to Web App as OWNER]
        SUCCESS_WEB_COOP[Login to Web App as COOPERATOR]
    end

    START --> EMAIL_LOGIN
    START --> OAUTH_LOGIN

    EMAIL_LOGIN --> WEB_MERCHANT
    EMAIL_LOGIN --> MOBILE_CLIENT
    OAUTH_LOGIN --> WEB_MERCHANT
    OAUTH_LOGIN --> MOBILE_CLIENT

    WEB_MERCHANT --> USER_EXISTS
    MOBILE_CLIENT --> USER_EXISTS

    USER_EXISTS -->|No| NO_USER
    USER_EXISTS -->|Yes| YES_USER

    YES_USER --> CHECK_ROLE

    CHECK_ROLE --> NEW_USER_ROLE
    CHECK_ROLE --> CLIENT_ROLE
    CHECK_ROLE --> OWNER_ROLE
    CHECK_ROLE --> COOPERATOR_ROLE

    NEW_USER_ROLE --> CHECK_SOURCE
    CHECK_SOURCE --> WEB_SOURCE
    CHECK_SOURCE --> MOBILE_SOURCE

    WEB_SOURCE --> COMPANY_DONE
    MOBILE_SOURCE --> EMAIL_VERIFIED

    COMPANY_DONE -->|No| NEED_COMPANY
    COMPANY_DONE -->|Yes| EMAIL_VERIFIED

    EMAIL_VERIFIED -->|No| NEED_EMAIL
    EMAIL_VERIFIED -->|Yes, had company data| BECOME_OWNER
    EMAIL_VERIFIED -->|Yes, no company data| BECOME_CLIENT

    CLIENT_ROLE --> CLIENT_APP
    CLIENT_APP -->|Mobile| CLIENT_TO_MOBILE
    CLIENT_APP -->|Web| CLIENT_TO_WEB

    CLIENT_TO_MOBILE --> SUCCESS_MOBILE
    CLIENT_TO_WEB --> UPGRADE_BUSINESS
    UPGRADE_BUSINESS --> ADD_OWNER
    ADD_OWNER --> SUCCESS_WEB_OWNER

    OWNER_ROLE --> OWNER_APP
    OWNER_APP -->|Web| OWNER_TO_WEB
    OWNER_APP -->|Mobile| OWNER_TO_MOBILE

    OWNER_TO_WEB --> SUCCESS_WEB_OWNER
    OWNER_TO_MOBILE --> AUTO_CLIENT
    AUTO_CLIENT --> SUCCESS_MOBILE

    COOPERATOR_ROLE --> COOP_APP
    COOP_APP -->|Web| COOP_TO_WEB
    COOP_APP -->|Mobile| COOP_TO_MOBILE

    COOP_TO_WEB --> SUCCESS_WEB_COOP
    COOP_TO_MOBILE --> AUTO_CLIENT_COOP
    AUTO_CLIENT_COOP --> SUCCESS_MOBILE

    BECOME_OWNER --> SUCCESS_WEB_OWNER
    BECOME_CLIENT --> SUCCESS_MOBILE
```

## Role Assignment Matrix

```mermaid
graph TB
    subgraph CurrentRole[Current User Role]
        NUR[NEW_USER]
        CR[CLIENT]
        OR[OWNER]
        COR[COOPERATOR]
    end

    subgraph LoginContext[Login Context]
        WEB[Web Merchant App]
        MOB[Mobile Client App]
    end

    subgraph Actions[Required Actions]
        COMPLETE[Complete Registration]
        UPGRADE[Upgrade to Business]
        AUTO_ADD[Auto Add CLIENT Role]
        DIRECT[Direct Login]
    end

    subgraph FinalAccess[Final Access Granted]
        WEB_OWNER[Web App as OWNER]
        WEB_COOP[Web App as COOPERATOR]
        MOB_CLIENT[Mobile App as CLIENT]
    end

    NUR -->|to Web| COMPLETE
    NUR -->|to Mobile| COMPLETE

    CR -->|to Web| UPGRADE
    CR -->|to Mobile| DIRECT

    OR -->|to Web| DIRECT
    OR -->|to Mobile| AUTO_ADD

    COR -->|to Web| DIRECT
    COR -->|to Mobile| AUTO_ADD

    COMPLETE -->|Web context| WEB_OWNER
    COMPLETE -->|Mobile context| MOB_CLIENT

    UPGRADE --> WEB_OWNER
    DIRECT -->|from CLIENT to Mobile| MOB_CLIENT
    DIRECT -->|from OWNER to Web| WEB_OWNER
    DIRECT -->|from COOPERATOR to Web| WEB_COOP

    AUTO_ADD --> MOB_CLIENT
```

## Email Verification & Company Data Requirements

```mermaid
graph TD
    subgraph Requirements[Login Requirements by Role Target]
        TO_CLIENT[Want CLIENT Role]
        TO_OWNER[Want OWNER Role]
    end

    subgraph Checks[Required Checks]
        EMAIL_CHECK{Email Verified?}
        COMPANY_CHECK{Company Data Complete?}
    end

    subgraph Actions[Required Actions]
        VERIFY_EMAIL[Must verify email first]
        FILL_COMPANY[Must complete company registration]
        BOTH[Must do both - email + company]
    end

    subgraph Results[Login Results]
        GRANT_CLIENT[Grant CLIENT role]
        GRANT_OWNER[Grant OWNER role]
        BLOCK_LOGIN[Block login - show requirements]
    end

    TO_CLIENT --> EMAIL_CHECK
    TO_OWNER --> EMAIL_CHECK

    EMAIL_CHECK -->|No| VERIFY_EMAIL
    EMAIL_CHECK -->|Yes, for CLIENT| GRANT_CLIENT
    EMAIL_CHECK -->|Yes, for OWNER| COMPANY_CHECK

    COMPANY_CHECK -->|No| FILL_COMPANY
    COMPANY_CHECK -->|Yes| GRANT_OWNER

    VERIFY_EMAIL --> BLOCK_LOGIN
    FILL_COMPANY --> BLOCK_LOGIN
    BOTH --> BLOCK_LOGIN
```

## Registration Source Impact on Login

```mermaid
graph LR
    subgraph RegistrationSource[Original Registration Source]
        WEB_REG[registrationSource: WEB_MERCHANT]
        MOB_REG[registrationSource: MOBILE_CLIENT]
    end

    subgraph LoginAttempt[Current Login Attempt]
        LOGIN_WEB[Logging into Web App]
        LOGIN_MOB[Logging into Mobile App]
    end

    subgraph ExpectedFlow[Expected Completion Flow]
        COMPANY_FLOW[Complete company registration]
        EMAIL_FLOW[Complete email verification]
        CROSS_UPGRADE[Cross-app upgrade flow]
    end

    WEB_REG -->|User tries Web login| COMPANY_FLOW
    WEB_REG -->|User tries Mobile login| EMAIL_FLOW

    MOB_REG -->|User tries Mobile login| EMAIL_FLOW
    MOB_REG -->|User tries Web login| CROSS_UPGRADE

    COMPANY_FLOW --> LOGIN_WEB
    EMAIL_FLOW --> LOGIN_MOB
    CROSS_UPGRADE --> LOGIN_WEB
```
