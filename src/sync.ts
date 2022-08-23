import * as core from '@actions/core'
import * as http from '@actions/http-client'
import {waitForJob} from './helpers'
import {HavaResult} from './types'

export class HavaSync {
  /**
   * Synchronizes a specific source through the Hava API
   *
   * @param sourceId The id of the source synchronise
   * @param havaToken Auth token to use to authenticate to the Hava API
   */
  async syncSource(sourceId: string, havaToken: string): Promise<HavaResult> {
    core.info(`Starting sync for source with id '${sourceId}`)

    const client = new http.HttpClient()
    client.requestOptions = {
      headers: {
        Authorization: `Bearer ${havaToken}`
      }
    }
    const result = await client.post(
      `https://api.hava.io/sources/${sourceId}/sync`,
      '{}'
    )

    if (result.message.statusCode === 404) {
      return {
        Success: false,
        Message: `Sync request to source with ID '${sourceId}' failed becuse a source with that ID was not found`
      }
    }

    if (result.message.statusCode === 422) {
      return {
        Success: false,
        Message: `Sync request failed, invalid ID format`
      }
    }

    if (result.message.statusCode !== 202) {
      return {
        Success: false,
        Message: `Sync request failed with unexpected http status code: ${result.message.statusCode}`
      }
    }

    const job = JSON.parse(await result.readBody())

    core.info(`Triggered sync with job ID: ${job.job_id}`)

    const jobResult = await waitForJob(job.job_id, client)

    if (!jobResult.Success) {
      return jobResult
    }

    core.info(`Sync completed!`)
    return {Success: true, Message: ''}
  }
}
