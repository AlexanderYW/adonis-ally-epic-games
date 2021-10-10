The package has been configured successfully!

Make sure to first define the mapping inside the `contracts/ally.ts` file as follows.

```ts
import { EpicGames, EpicGamesConfig } from 'adonis-ally-epic-games/build/standalone'

declare module '@ioc:Adonis/Addons/Ally' {
  interface SocialProviders {
    // ... other mappings
    EpicGames: {
      config: EpicGamesConfig
      implementation: EpicGamesConfig
    }
  }
}
```

```ts
const allyConfig: AllyConfig = {
  // ... other configs
  /*
  |--------------------------------------------------------------------------
  | EpicGames driver
  |--------------------------------------------------------------------------
  */
  EpicGames: {
    driver: 'EpicGames',
    clientId: Env.get('EPICGAMES_CLIENT_ID'),
    clientSecret: Env.get('EPICGAMES_CLIENT_SECRET'),
    callbackUrl: `https://127.0.0.1:${process.env.PORT}/epicgames/callback`,
    scopes: Env.get('EPICGAMES_SCOPE'),
  },
}
```