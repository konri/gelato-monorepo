import { Query, Resolver } from 'type-graphql';

@Resolver()
export class HealthResolver {
  @Query(() => String)
  health(): string {
    return 'OK';
  }

  @Query(() => String)
  async dbHealth(): Promise<string> {
    // TODO: Add actual database health check
    return 'Database connected';
  }
}
