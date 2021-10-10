import type { ApplicationContract } from '@ioc:Adonis/Core/Application'

export default class EpicGamesProvider {
  constructor(protected app: ApplicationContract) {}

  public async boot() {
    const Ally = this.app.container.resolveBinding('Adonis/Addons/Ally')
    const { EpicGames } = await import('../src/Epicgames')

    Ally.extend('EpicGames', (_, __, config, ctx) => {
      return new EpicGames(ctx, config)
    })
  }
}
