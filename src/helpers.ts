import {HttpClient} from '@actions/http-client'
import {HavaResult} from './types'
import * as core from '@actions/core'

/**
 * Static map representing supported view types for export and their mapping to real hava view types
 */
const ViewTypeMap: Map<string, string> = new Map([
  ['infrastructure', 'Views::Infrastructure'],
  ['security', 'Views::Security'],
  ['container', 'Views::Container']
])

export {ViewTypeMap}

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

    if (result.message.statusCode === 401) {
      return {
        Success: false,
        Message: `Unauthorized returned by the API, is the API token valid?`
      }
    }

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

/**
 * Case-sentive validation of supported view types
 *
 *  @param viewType name of the view to validate
 *  @return true if a valid view type, false otherwise
 */
export function validateViewType(viewType: string): HavaResult {
  if (!ViewTypeMap.has(viewType)) {
    const message = `View type '${viewType}' not known, supported values are: ${[
      ...ViewTypeMap.keys()
    ].join(',')}`

    return {Success: false, Message: message}
  }

  return {Success: true, Message: ''}
}

/**
 * Validates user input
 * @param sourceId Hava Source ID to validate
 * @param environmentId Hava Environment ID to validate
 * @param viewType  Hava View type to validate
 * @param havaToken  Hava Token to validate
 * @param imagePath  Image Path to validate
 * @param skipExport  impacts validation, if true, viewtype, environmentid and imagepath won't be validated
 * @returns HavaResult object with Success= true on success, and false on failure with extra information in the message
 */
export function validateUserInput(
  sourceId: string,
  environmentId: string,
  viewType: string,
  havaToken: string,
  imagePath: string,
  skipExport: boolean
): HavaResult {
  core.info('Validating User Input')

  let errorFound = false
  const errors = []

  if (!checkIfValidUUID(sourceId)) {
    errorFound = true
    const msg = `Source Id '${sourceId}' is not well formed, shouild be a UUID`
    core.error(msg)
    errors.push(msg)
  }

  if (!havaToken) {
    errorFound = true
    const msg = `Hava token is not set`
    core.error(msg)
    errors.push(msg)
  }

  if (!skipExport) {
    if (!environmentId) {
      errorFound = true
      const msg = `Environment Id is required when skip_export is false`
      core.error(msg)
      errors.push(msg)
    } else if (!checkIfValidUUID(environmentId)) {
      errorFound = true
      const msg = `Environment Id '${environmentId}' is not well formed, shouild be a UUID`
      core.error(msg)
      errors.push(msg)
    }

    if (!viewType) {
      errorFound = true
      const msg = `View type is required when skip_export is false`
      core.error(msg)
      errors.push(msg)
    } else {
      const viewTypeResuilt = validateViewType(viewType)

      if (!viewTypeResuilt.Success) {
        errorFound = true
        core.error(viewTypeResuilt.Message)
        errors.push(viewTypeResuilt.Message)
      }
    }
    const pathResult = checkIfValidPath(imagePath)

    if (!pathResult.Success) {
      errorFound = true
      core.error(pathResult.Message)
      errors.push(pathResult.Message)
    }
  }

  if (errorFound) {
    return {
      Success: false,
      Message: errors.join('\n')
    }
  }

  core.info('Input Validation Complete!')
  return {Success: true, Message: ''}
}

function checkIfValidUUID(str: string): boolean {
  // Regular expression to check if string is a valid UUID
  const regexExp =
    /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/gi

  return regexExp.test(str)
}

export function checkIfValidPath(path: string): HavaResult {
  const valid = /^.?[/A-Za-z0-9]+.png$/

  if (valid.test(path)) {
    return {
      Success: true,
      Message: ''
    }
  }

  return {
    Success: false,
    Message:
      'Invalid path, please limit the path to alphanumeric characters and forward slash for folders'
  }
}
