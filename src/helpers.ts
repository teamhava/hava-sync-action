import {HttpClient} from '@actions/http-client'
import {HavaResult} from './types'
import * as core from '@actions/core'

/**
 * Waits for a job request to complete and returns the result
 *
 * @param jobId the id of the job to wait for
 * @param headers the authentication headers for the API requests
 */
export async function waitForJob(
  jobId: string,
  client: HttpClient
): Promise<HavaResult> {
  let jobActive = true
  const waitStart = Date.now()
  const timeout = 360000 // millisecs

  const reqOptions = {
    headers: client.requestOptions?.headers,
    allowRedirects: false
  }

  const newClient = new HttpClient(undefined, undefined, reqOptions)

  core.info(`Waiting for job '${jobId}' to complete`)
  core.info(`Timeout set to ${timeout} milliseconds`)

  const jobUrl = `https://api.hava.io/jobs/${jobId}`

  let location = ''

  while (jobActive) {
    if (Date.now() - waitStart >= timeout) {
      return {
        Success: false,
        Message: `Timed out waiting for Sync job to finish, jobid: ${jobId}`
      }
    }

    const result = await newClient.get(jobUrl)

    if (result.message.statusCode === 200) {
      const body = JSON.parse(await result.readBody())
      if (body.state !== 'active' && body.state !== 'queued') {
        jobActive = false
        break
      }
    } else if (result.message.statusCode === 303) {
      // redirect because job is complete?
      if (result.message.headers['location'])
        location = result.message.headers['location']

      jobActive = false
      break
    } else {
      return {
        Success: false,
        Message: `Unexpected error, http error code: ${result.message.statusCode} while waiting for job to complete`
      }
    }

    // wait for 1 sec until we check again
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  return {Success: true, Message: location}
}
