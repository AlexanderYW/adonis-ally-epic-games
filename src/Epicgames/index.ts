/*
|--------------------------------------------------------------------------
| Ally Oauth driver
|--------------------------------------------------------------------------
|
| This is a dummy implementation of the Oauth driver. Make sure you
|
| - Got through every line of code
| - Read every comment
|
*/

import type {
  AllyUserContract,
  ApiRequestContract,
  LiteralStringUnion,
} from '@ioc:Adonis/Addons/Ally'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { Oauth2Driver, ApiRequest, RedirectRequest } from '@adonisjs/ally/build/standalone'

/**
 * Define the access token object properties in this type. It
 * must have "token" and "type" and you are free to add
 * more properties.
 *
 * ------------------------------------------------
 * Change "EpicGames" to something more relevant
 * ------------------------------------------------
 */
export type EpicGamesAccessToken = {
  scope: string
  token_type: string
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: Date
  refresh_expires_in: number
  refresh_expires_at: Date
  account_id: string
  client_id: string
  application_id: string
  token: string
  type: string
}

/**
 * Define a union of scopes your driver accepts. Here's an example of same
 * https://github.com/adonisjs/ally/blob/develop/adonis-typings/ally.ts#L236-L268
 *
 * ------------------------------------------------
 * Change "EpicGames" to something more relevant
 * ------------------------------------------------
 */
export type EpicGamesScopes = string

/**
 * Define the configuration options accepted by your driver. It must have the following
 * properties and you are free add more.
 *
 * ------------------------------------------------
 * Change "EpicGames" to something more relevant
 * ------------------------------------------------
 */
export type EpicGamesConfig = {
  driver: 'EpicGames'
  clientId: string
  clientSecret: string
  callbackUrl: string
  scopes?: LiteralStringUnion<EpicGamesScopes>[]
}

export type UserInfo = {
  sub: string
  preferred_username: string
}

/**
 * Driver implementation. It is mostly configuration driven except the user calls
 *
 * ------------------------------------------------
 * Change "EpicGames" to something more relevant
 * ------------------------------------------------
 */
export class EpicGames extends Oauth2Driver<EpicGamesAccessToken, EpicGamesScopes> {
  /**
   * The URL for the redirect request. The user will be redirected on this page
   * to authorize the request.
   *
   * Do not define query strings in this URL.
   */
  protected authorizeUrl = 'https://www.epicgames.com/id/authorize'

  /**
   * The URL to hit to exchange the authorization code for the access token
   *
   * Do not define query strings in this URL.
   */
  protected accessTokenUrl = 'https://api.epicgames.dev/epic/oauth/v1/token'

  /**
   * The URL to hit to get the user details
   *
   * Do not define query strings in this URL.
   */
  protected userInfoUrl = 'https://api.epicgames.dev/epic/oauth/v1/userInfo'

  /**
   * The param name for the authorization code. Read the documentation of your oauth
   * provider and update the param name to match the query string field name in
   * which the oauth provider sends the authorization_code post redirect.
   */
  protected codeParamName = 'code'

  /**
   * The param name for the error. Read the documentation of your oauth provider and update
   * the param name to match the query string field name in which the oauth provider sends
   * the error post redirect
   */
  protected errorParamName = 'error'

  /**
   * Cookie name for storing the CSRF token. Make sure it is always unique. So a better
   * approach is to prefix the oauth provider name to `oauth_state` value. For example:
   * For example: "facebook_oauth_state"
   */
  protected stateCookieName = 'epicgames_oauth_state'

  /**
   * Parameter name to be used for sending and receiving the state from.
   * Read the documentation of your oauth provider and update the param
   * name to match the query string used by the provider for exchanging
   * the state.
   */
  protected stateParamName = 'state'

  /**
   * Parameter name for sending the scopes to the oauth provider.
   */
  protected scopeParamName = 'scope'

  /**
   * The separator indentifier for defining multiple scopes
   */
  protected scopesSeparator = ' '

  constructor(ctx: HttpContextContract, public config: EpicGamesConfig) {
    super(ctx, config)

    config.scopes = config.scopes || ['basic_profile']

    /**
     * Extremely important to call the following method to clear the
     * state set by the redirect request.
     *
     * DO NOT REMOVE THE FOLLOWING LINE
     */
    this.loadState()
  }

  /**
   * Optionally configure the authorization redirect request. The actual request
   * is made by the base implementation of "Oauth2" driver and this is a
   * hook to pre-configure the request.
   */
  protected configureRedirectRequest(request: RedirectRequest<EpicGamesScopes>) {
    request.param('grant_type', 'authorization_code')
    request.param('response_type', 'code')
  }

  /**
   * Optionally configure the access token request. The actual request is made by
   * the base implementation of "Oauth2" driver and this is a hook to pre-configure
   * the request
   */
  protected configureAccessTokenRequest(request: ApiRequest) {
    request.clear()

    // Header
    request.header(
      'Authorization',
      'Basic ' +
        Buffer.from(this.config.clientId + ':' + this.config.clientSecret).toString('base64')
    )

    // Body
    request.field('clientId', this.config.clientId)
    request.field('clientSecret', this.config.clientSecret)
    request.field('grant_type', 'authorization_code')
    if (this.hasCode()) {
      request.field('code', this.getCode())
    }

    console.log('request token', request)
  }

  /**
   * Update the implementation to tell if the error received during redirect
   * means "ACCESS DENIED".
   */
  public accessDenied() {
    return this.ctx.request.input('error') === 'invalid_grant'
  }

  /**
   * Returns the HTTP request with the authorization header set
   */
  protected getAuthenticatedRequest(url: string, token: string) {
    const request = this.httpClient(url)
    console.log(token)
    request.header('Authorization', `Bearer ${token}`)
    request.header('Accept', 'application/json')
    request.parseAs('json')
    return request
  }

  /**
   * Fetches the user info from the Google API
   */
  protected async getUserInfo(token: string, callback?: (request: ApiRequestContract) => void) {
    // User Info
    const userRequest = this.getAuthenticatedRequest(this.userInfoUrl, token)
    if (typeof callback === 'function') {
      callback(userRequest)
    }

    const userBody: UserInfo = await userRequest.get()

    console.log(userBody)

    return {
      id: userBody.sub,
      nickName: userBody.preferred_username,
      name: '',
      email: null,
      emailVerificationState: 'unsupported' as const,
      avatarUrl: null,
      original: userBody,
      //name: `${userBody.givenName}${userBody.surname ? ` ${userBody.surname}` : ''}`,
    }
  }

  /**
   * Processing the API client response. The child class can overwrite it
   * for more control
   */
  protected override processClientResponse(client: ApiRequest, response: any): any {
    /**
     * Return json as it is when parsed response as json
     */
    if (client.responseType === 'json') {
      return response
    } else if (client.responseType === 'text') {
      try {
        return JSON.parse(response)
      } catch {
        return response
      }
    }

    return response
  }

  /**
   * Get the user details by query the provider API. This method must return
   * the access token and the user details both. Checkout the google
   * implementation for same.
   *
   * https://github.com/adonisjs/ally/blob/develop/src/Drivers/Google/index.ts#L191-L199
   */
  public async user(
    callback?: (request: ApiRequest) => void
  ): Promise<AllyUserContract<EpicGamesAccessToken>> {
    const accessToken = await this.accessToken()

    /**
     * Allow end user to configure the request. This should be called after your custom
     * configuration, so that the user can override them (if required)
     */
    const user = await this.getUserInfo(accessToken.token, callback)
    /**
     * Write your implementation details here
     */
    return {
      ...user,
      token: accessToken,
    }
  }

  /**
   * Finds the user by the access token
   */
  public async userFromToken(token: string) {
    const user = await this.getUserInfo(token)

    return {
      ...user,
      token: { token, type: 'bearer' as const },
    }
  }
}
