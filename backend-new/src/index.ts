import 'reflect-metadata';
import express from 'express';
import { createServer } from 'http';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import { useServer } from 'graphql-ws/lib/use/ws';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { HealthResolver } from './resolvers/HealthResolver';
import { AuthResolver } from './resolvers/AuthResolver';
import { UserResolver } from './resolvers/UserResolver';
import { SpotResolver } from './resolvers/SpotResolver';
import { CityResolver } from './resolvers/CityResolver';
import { ProductResolver } from './resolvers/ProductResolver';
import { PromoCodeResolver } from './resolvers/PromoCodeResolver';
import { NotificationResolver } from './resolvers/NotificationResolver';
import { SubscriptionResolver } from './resolvers/SubscriptionResolver';
import { TasteResolver } from './resolvers/TasteResolver';
import { OrderResolver } from './resolvers/OrderResolver';
import { CourierResolver, CourierApplicationResolver } from './resolvers/CourierResolver';
import { PointsResolver } from './resolvers/PointsResolver';
import { NewsResolver, NewsCommentResolver } from './resolvers/NewsResolver';
import { PaymentResolver } from './resolvers/PaymentResolver';
import { PrizeResolver } from './resolvers/PrizeResolver';
import { ReviewResolver } from './resolvers/ReviewResolver';
import { AdminResolver } from './resolvers/AdminResolver';
import { authMiddleware, authChecker } from './middleware/authMiddleware';
import { verifyAccessToken } from './auth/PasswordUtil';
import { StripeService } from './services/StripeService';
import uploadRoutes from './routes/upload';
import stripeWebhookRoutes from './routes/stripe-webhook';
import authRoutes from './routes/authRoutes';

dotenv.config();

const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const PORT = process.env.PORT || 4000;

  // Initialize Stripe
  StripeService.initialize();

  // Initialize Email Service
  const { EmailService } = await import('./services/EmailService');
  EmailService.initialize();

  // Stripe webhook needs raw body
  app.use('/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookRoutes);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(authMiddleware);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Auth routes (REST API for Google/Apple Sign-In)
  app.use('/authorization', authRoutes);

  // Upload routes (REST API for file uploads)
  app.use('/upload', uploadRoutes);

  // Build GraphQL schema
  const schema = await buildSchema({
    resolvers: [
      HealthResolver,
      AuthResolver,
      UserResolver,
      SpotResolver,
      CityResolver,
      NotificationResolver,
      SubscriptionResolver,
      TasteResolver,
      ProductResolver,
      PromoCodeResolver,
      OrderResolver,
      CourierResolver,
      CourierApplicationResolver,
      PointsResolver,
      NewsResolver,
      NewsCommentResolver,
      PaymentResolver,
      PrizeResolver,
      ReviewResolver,
      AdminResolver,
    ],
    authChecker: authChecker,
    emitSchemaFile: true,
    validate: false,
    pubSub: require('./services/PubSubService').PubSubService.getInstance(),
  });

  // Create WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  // Setup graphql-ws
  useServer(
    {
      schema,
      context: async (ctx) => {
        // Extract auth token from connection params
        const token = ctx.connectionParams?.authorization?.replace('Bearer ', '');
        let user = null;

        if (token) {
          try {
            const payload = verifyAccessToken(token);
            user = await prisma.user.findUnique({
              where: { id: payload.userId },
            });

            // Check token version
            if (user && user.tokenVersion !== payload.tokenVersion) {
              user = null;
            }
          } catch (error) {
            console.log('WebSocket auth failed:', error);
          }
        }

        return {
          req: { user },
          prisma,
        };
      },
      onConnect: async (ctx) => {
        console.log('🔌 WebSocket client connected');
      },
      onDisconnect: (ctx) => {
        console.log('🔌 WebSocket client disconnected');
      },
    },
    wsServer
  );

  // Create Apollo Server
  const server = new ApolloServer({
    schema,
    context: ({ req, res }) => ({
      req,
      res,
      prisma,
    }),
    introspection: process.env.NODE_ENV !== 'production',
    playground: process.env.NODE_ENV !== 'production',
    plugins: [
      {
        async serverWillStart() {
          return {
            async drainServer() {
              wsServer.close();
            },
          };
        },
      },
    ],
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 GraphQL endpoint: http://localhost:${PORT}${server.graphqlPath}`);
    console.log(`🔌 WebSocket endpoint: ws://localhost:${PORT}/graphql`);
  });
}

startServer().catch((error) => {
  console.error('Error starting server:', error);
  process.exit(1);
});
