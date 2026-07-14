import 'reflect-metadata'
import express from 'express'
import { ApolloServer } from 'apollo-server-express'
import { GraphQLSchema } from 'graphql/type/schema'
import * as tq from 'type-graphql'
import passport from 'passport'

import cors from 'cors'
import * as Sentry from '@sentry/node'
import * as Tracing from '@sentry/tracing'
import * as firebaseAdmin from 'firebase-admin'
import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import { UserResolver } from './User/resolver/UserResolver'
import prisma from './shared/prisma'
import authRoute from './Auth/AuthRoute'
import { authChecker } from './Auth/TokenBlacklistMiddleware'
import addPassportAuth from './Auth/AuthStrategies'
import { LogoutResolver } from './Auth/LogoutResolver'
import { SubscriptionResolver } from './Subscription/resolver/SubscriptionResolver'
import { UtilResolver } from './shared/resolver/UtilResolver'
import uploadRoute from './Upload/UploadRoute'
import { AuthGuard } from './Auth/AuthGuard'
import { Role } from './User/objectType/Role'
import { FeedbackResolver } from './Feedback/resolver/FeedbackResolver'
import { TeamMateResolver } from './TeamMate/TeamMateResolver'
import { NotificationResolver as OldNotificationResolver } from './Notification/resolver/NotificationResolver'
import { NotificationResolver as PushNotificationResolver } from './User/resolver/NotificationResolver'
import { firebaseConfig } from './Config/firebase-config'
import { CompanyOwnerResolver } from './CompanyOwner/resolver/CompanyOwnerResolver'
import { CooperatorResolver } from './Cooperator/resolver/CooperatorResolver'
import { ClientResolver } from './Client/resolver/ClientResolver'

import { FileResolver } from './File/resolver/FileResolver'

import { NotificationListResolver } from './NotificationList/resolver/NotificationListResolver'
import { SubscriptionPlanResolver } from './Subscription/resolver/PlanResolver'
import { ReferralResolver } from './Referral/resolver/ReferralResolver'
import { MerchantResolver } from './Merchant/resolver/MerchantResolver'
import { PointVoucherResolver } from './PointVoucher/resolver/PointVoucherResolver'
import { UserPointVoucherResolver } from './PointVoucher/resolver/UserPointVoucherResolver'
import { VoucherResolver } from './Voucher/resolver/VoucherResolver'
import { PointsResolver } from './Points/resolver/PointsResolver'
import { LoyaltyStampResolver } from './LoyaltyStamps/resolver/LoyaltyStampResolver'
import { NipResolver } from './shared/resolver/NipResolver'
import { CouponResolver } from './Coupon/resolver/CouponResolver'
import { UserActivityResolver } from './User/resolver/UserActivityResolver'
import { ActivityTimelineResolver } from './User/resolver/ActivityTimelineResolver'
import { LocationResolver } from './Location/resolver/LocationResolver'
import { MerchantStoreResolver } from './Merchant/resolver/MerchantStoreResolver'
import { UserMerchantVoucherResolver } from './Merchant/resolver/UserMerchantVoucherResolver'
import { BottomMenuResolver } from './shared/resolver/BottomMenuResolver'
import { RewardResolver } from './Reward/resolver/RewardResolver'
import { StreakResolver } from './Streak/resolver/StreakResolver'
import { ProfileSetupResolver } from './ProfileSetup/ProfileSetupResolver'
import { OrderResolver } from './Order/resolver/OrderResolver'
import { FavoriteStoreResolver } from './FavoriteStore/resolver/FavoriteStoreResolver'
import orderRoutes from './Order/routes/orderRoutes'
import { MerchantStatsResolver } from './stats/graphql/MerchantStatsResolver'
import './LoyaltyStamps/objectType/StampMilestone'
import './queues/notificationQueue' // Start notification worker
import './Order/jobs/orderJobs' // Start order BullMQ workers

const appInit = async () => {
  // Set process title for easier identification
  process.title = 'api-dev.easybons.com'
  process.argv[0] = 'api-dev.easybons.com'

  const app = express()

  if (process.env.ENVIRONMENT !== 'production') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires,global-require
    const dotenv = require('dotenv')
    dotenv.config()
    console.log('Not production build')
    console.log(`[INFO] Running in ${process.env.ENVIRONMENT} mode`)
    console.log('DATABASE_URL == ' + process.env.DATABASE_URL)
  } else {
    console.log('Production build!')

    if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== 'disabled') {
      console.log('Sentry enabled')
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [new Sentry.Integrations.Http({ tracing: true }), new Tracing.Integrations.Express({ app })],
        tracesSampleRate: 1.0,
      })
    } else {
      console.log('Sentry disabled – skipping init')
    }
  }

  await i18next.use(Backend).init({
    // debug: true,
    lng: 'pl',
    fallbackLng: 'pl',
    preload: ['en', 'pl'],
    backend: {
      loadPath: './dist/locales/{{lng}}/translation.json',
    },
    load: 'languageOnly',
    initImmediate: false,
  })

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== 'disabled') {
    app.use(Sentry.Handlers.requestHandler())
    app.use(Sentry.Handlers.tracingHandler())
  }

  // app.use(bodyParser.urlencoded({ extended: false }))
  // app.use(bodyParser.json({ limit: '5mb' }))
  // app.use(bodyParser.urlencoded({ limit: '5mb', extended: true }))
  app.use((req, res, next) => {
    if (req.originalUrl.includes('webhook')) {
      next()
    } else {
      express.json()(req, res, next)
    }
  })
  app.use(cors())

  app.use(passport.initialize())
  app.use(passport.session())
  app.use('/authorization', authRoute)
  app.use('/upload', AuthGuard([Role.ADMIN, Role.OWNER, Role.COOPERATOR, Role.CLIENT, Role.NEW_USER]), uploadRoute)
  app.use('/orders', orderRoutes)
  app.use('/api/static', express.static('public/static'))

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' })
  })

  app.get('/debug-sentry', function mainHandler(req, res) {
    throw new Error('My first Sentry error!')
  })

  addPassportAuth()

  // handle all graphql with jwt authenticate
  app.use('/graphql', (req, res, next) => {
    passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
      if (user) {
        req.user = user
      }

      next()
    })(req, res, next)
  })

  const schema: GraphQLSchema = await tq.buildSchema({
    resolvers: [
      UserResolver,
      CompanyOwnerResolver,
      CooperatorResolver,
      ClientResolver,
      SubscriptionResolver,
      SubscriptionPlanResolver,
      UtilResolver,
      FeedbackResolver,
      TeamMateResolver,
      OldNotificationResolver,
      PushNotificationResolver,
      FileResolver,
      NotificationListResolver,
      ReferralResolver,
      MerchantResolver,
      MerchantStoreResolver,
      UserMerchantVoucherResolver,
      PointVoucherResolver,
      UserPointVoucherResolver,
      VoucherResolver,
      PointsResolver,
      LoyaltyStampResolver,
      NipResolver,
      CouponResolver,
      UserActivityResolver,
      ActivityTimelineResolver,
      LocationResolver,
      BottomMenuResolver,
      RewardResolver,
      StreakResolver,
      ProfileSetupResolver,
      OrderResolver,
      FavoriteStoreResolver,
      LogoutResolver,
      MerchantStatsResolver,
    ],
    authChecker,
    emitSchemaFile: true,
  })

  const server = new ApolloServer({
    schema,
    context: ({ req, res }) => ({ req, res, prisma, user: req.user }),
    formatError: (err) => {
      // If the error has a status code, try to set the HTTP status
      if (err.extensions?.exception?.status) {
        // Note: Apollo Server v3 doesn't directly support setting HTTP status codes
        // from GraphQL errors, but we can include the status in the error response
        return {
          message: err.message,
          extensions: {
            ...err.extensions,
            code: err.extensions.exception.status,
          },
        }
      }

      return err
    },
  })

  await server.start()

  // setup
  // @ts-ignore
  server.applyMiddleware({ app, cors: false })

  // The error handler must be before any other error middleware and after all controllers
  if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== 'disabled') {
    app.use(Sentry.Handlers.errorHandler())
  }

  // Optional fallthrough error handler
  app.use(function onError(err: any, req: any, res: any, next: any) {
    // Handle ErrorWithStatus objects with proper status codes
    if (err.status && typeof err.status === 'number') {
      return res.status(err.status).json({
        error: err.msg || err.message || 'An error occurred',
        status: err.status,
        ...(typeof err.code === 'string' ? { code: err.code } : {}),
      })
    }

    // Default to 500 for unknown errors
    res.status(500).json({
      error: 'Internal server error',
      status: 500,
    })
  })

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(firebaseConfig as any),
      })
      console.log('✅ Firebase initialized')
    }
  } else {
    console.warn('⚠️  Firebase credentials not configured - skipping initialization')
  }

  const { PORT } = process.env

  app.listen({ port: PORT || 5000 }, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`)
  })
}

appInit()
