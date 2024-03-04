import { initDb, useDb } from "../../../../environment-helpers/use-db"

import { ApiKeyType } from "@medusajs/utils"
import { IApiKeyModuleService, IRegionModuleService } from "@medusajs/types"
import { ModuleRegistrationName } from "@medusajs/modules-sdk"
import { createAdminUser } from "../../../helpers/create-admin-user"
import { getContainer } from "../../../../environment-helpers/use-container"
import path from "path"
import { startBootstrapApp } from "../../../../environment-helpers/bootstrap-app"
import { useApi } from "../../../../environment-helpers/use-api"

jest.setTimeout(50000)

const env = { MEDUSA_FF_MEDUSA_V2: true }
const adminHeaders = {
  headers: { "x-medusa-access-token": "test_token" },
}

describe("API Keys - Admin", () => {
  let dbConnection
  let appContainer
  let shutdownServer
  let service: IApiKeyModuleService
  let regionService: IRegionModuleService

  beforeAll(async () => {
    const cwd = path.resolve(path.join(__dirname, "..", "..", ".."))
    dbConnection = await initDb({ cwd, env } as any)
    shutdownServer = await startBootstrapApp({ cwd, env })
    appContainer = getContainer()
    service = appContainer.resolve(ModuleRegistrationName.API_KEY)
    regionService = appContainer.resolve(ModuleRegistrationName.REGION)
  })

  afterAll(async () => {
    const db = useDb()
    await db.shutdown()
    await shutdownServer()
  })

  beforeEach(async () => {
    await createAdminUser(dbConnection, adminHeaders)
  })

  afterEach(async () => {
    const db = useDb()
    // TODO: Once teardown doesn't skip constraint checks and cascades, we can remove this
    const existingRegions = await regionService.list({})
    await regionService.delete(existingRegions.map((r) => r.id))
    await db.teardown()
  })

  it("should correctly implement the entire lifecycle of an api key", async () => {
    const api = useApi() as any
    const created = await api.post(
      `/admin/api-keys`,
      {
        title: "Test Secret Key",
        type: ApiKeyType.SECRET,
      },
      adminHeaders
    )

    expect(created.status).toEqual(200)
    expect(created.data.apiKey).toEqual(
      expect.objectContaining({
        id: created.data.apiKey.id,
        title: "Test Secret Key",
        created_by: "admin_user",
      })
    )
    // On create we get the token in raw form so we can store it.
    expect(created.data.apiKey.token).toContain("sk_")

    const updated = await api.post(
      `/admin/api-keys/${created.data.apiKey.id}`,
      {
        title: "Updated Secret Key",
      },
      adminHeaders
    )

    expect(updated.status).toEqual(200)
    expect(updated.data.apiKey).toEqual(
      expect.objectContaining({
        id: created.data.apiKey.id,
        title: "Updated Secret Key",
      })
    )

    const revoked = await api.post(
      `/admin/api-keys/${created.data.apiKey.id}/revoke`,
      {},
      adminHeaders
    )

    expect(revoked.status).toEqual(200)
    expect(revoked.data.apiKey).toEqual(
      expect.objectContaining({
        id: created.data.apiKey.id,
        revoked_by: "admin_user",
      })
    )
    expect(revoked.data.apiKey.revoked_at).toBeTruthy()

    const deleted = await api.delete(
      `/admin/api-keys/${created.data.apiKey.id}`,
      adminHeaders
    )
    const listedApiKeys = await api.get(`/admin/api-keys`, adminHeaders)

    expect(deleted.status).toEqual(200)
    expect(listedApiKeys.data.apiKeys).toHaveLength(0)
  })

  it("can use a secret api key for authentication", async () => {
    const api = useApi() as any
    const created = await api.post(
      `/admin/api-keys`,
      {
        title: "Test Secret Key",
        type: ApiKeyType.SECRET,
      },
      adminHeaders
    )

    const createdRegion = await api.post(
      `/admin/regions`,
      {
        name: "Test Region",
        currency_code: "usd",
        countries: ["us", "ca"],
      },
      {
        auth: {
          username: created.data.apiKey.token,
        },
      }
    )

    expect(createdRegion.status).toEqual(200)
    expect(createdRegion.data.region.name).toEqual("Test Region")
  })

  it("falls back to other mode of authentication when an api key is not valid", async () => {
    const api = useApi() as any
    const created = await api.post(
      `/admin/api-keys`,
      {
        title: "Test Secret Key",
        type: ApiKeyType.SECRET,
      },
      adminHeaders
    )

    await api.post(
      `/admin/api-keys/${created.data.apiKey.id}/revoke`,
      {},
      adminHeaders
    )

    const err = await api
      .post(
        `/admin/regions`,
        {
          name: "Test Region",
          currency_code: "usd",
          countries: ["us", "ca"],
        },
        {
          auth: {
            username: created.data.apiKey.token,
          },
        }
      )
      .catch((e) => e.message)

    const createdRegion = await api.post(
      `/admin/regions`,
      {
        name: "Test Region",
        currency_code: "usd",
        countries: ["us", "ca"],
      },
      {
        auth: {
          username: created.data.apiKey.token,
        },
        ...adminHeaders,
      }
    )

    expect(err).toEqual("Request failed with status code 401")
    expect(createdRegion.status).toEqual(200)
    expect(createdRegion.data.region.name).toEqual("Test Region")
  })
})