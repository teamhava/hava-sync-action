import {HavaResult, View} from './types'

import * as core from '@actions/core'
import * as http from '@actions/http-client'
import {waitForJob} from './helpers'
import {writeFileSync} from 'fs'

/**
 * Options for export
 */
export type ExporterOptions = {
  EnvironmentID: string
  ViewType: string
  HavaToken: string
  ImagePath: string
}

export class HavaExporter {
  /**
   * Static map representing supported view types for export and their mapping to real hava view types
   */
  private viewTypeMap: Map<string, string> = new Map([
    ['infrastructure', 'Views::Infrastructure'],
    ['security', 'Views::Security'],
    ['container', 'Views::Container']
  ])

  /**
   * Exports an environment as a png image
   * @param options Options for the exporter, see ExporterOptions for details
   * @returns Result object with status, and messages
   */
  async export(options: ExporterOptions): Promise<HavaResult> {
    core.info('Validating input')
    const validationResult = this.validateViewType(options.ViewType)

    if (!validationResult.Success) {
      return validationResult
    }

    core.info('Input valid')
    core.info('Starting export')

    let client = new http.HttpClient()
    client.requestOptions = {
      headers: {
        Authorization: `Bearer ${options.HavaToken}`
      }
    }

    const viewIdResult = await this.getEnvironmentViewId(
      options.EnvironmentID,
      options.ViewType,
      client
    )

    if (!viewIdResult.Success) {
      return {
        Success: false,
        Message: viewIdResult.Message
      }
    }

    core.info(`View found: ${viewIdResult.Message}`)

    const exportResult = await this.exportPNG(viewIdResult.Message, client)

    if (!exportResult.Success) {
      core.error(exportResult.Message)
      return exportResult
    }

    core.info(`PNG exported to: ${exportResult.Message}`)

    client = new http.HttpClient()

    const pngData = await client.get(exportResult.Message)

    if (pngData.message.statusCode !== 200) {
      return {
        Success: false,
        Message: `Unexpected status code when downloading png '${pngData.message.statusCode}'`
      }
    }

    const imgData = await this.getImageData(pngData)

    writeFileSync(options.ImagePath, imgData)

    return exportResult
  }

  private async getImageData(data: http.HttpClientResponse): Promise<Buffer> {
    return new Promise<Buffer>(async resolve => {
      let output = Buffer.alloc(0)

      data.message.on('data', (chunk: Buffer) => {
        output = Buffer.concat([output, chunk])
      })

      data.message.on('end', () => {
        resolve(output)
      })
    })
  }

  /**
   * Returns the id of the first view that matches the ViewType for a specific environment
   * @param environmentID Environment id to get views for
   * @param viewType Type of the view to get id for
   * @param client http client to connect to rest endpoint with
   * @returns Result object with status and data
   */
  private async getEnvironmentViewId(
    environmentID: string,
    viewType: string,
    client: http.HttpClient
  ): Promise<HavaResult> {
    const result = await client.get(
      `https://api.hava.io/environments/${environmentID}`
    )

    if (result.message.statusCode === 404) {
      return {
        Success: false,
        Message: `Export request to environment with ID '${environmentID}' failed becuse an environment with that ID was not found`
      }
    }

    if (result.message.statusCode !== 200) {
      return {
        Success: false,
        Message: `Unknown error code returned when requesting environment details: '${result.message.statusCode}'`
      }
    }

    const environment = JSON.parse(await result.readBody())

    const views = environment.views.filter(
      (x: View) => x.type === this.viewTypeMap.get(viewType)
    )

    if (views.length < 1) {
      return {
        Success: false,
        Message: `No views matching type '${viewType}' on environment with id '${environmentID}'`
      }
    } else if (views.length > 1) {
      core.warning(
        `Multiple views of type '${viewType}' found, selecting the first one!`
      )
    }

    return {
      Success: true,
      Message: views[0].id
    }
  }

  /**
   * Exports a specific Hava view as a PNG
   * @param viewId ID of the view to generate a PNG image for
   * @param client http client to connect to rest endpoint with
   * @returns Result object with status and image path as the result
   */
  private async exportPNG(
    viewId: string,
    client: http.HttpClient
  ): Promise<HavaResult> {
    const exportRequestBody = {
      export_format: 'png',
      connections: true,
      isometric: false,
      labels: false
    }

    const result = await client.post(
      `https://api.hava.io/views/${viewId}/export`,
      JSON.stringify(exportRequestBody),
      {'Content-Type': 'application/json'}
    )

    if (result.message.statusCode === 404) {
      return {
        Success: false,
        Message: `Could not find view with ID '${viewId}. This should never happen!`
      }
    }

    if (result.message.statusCode === 422) {
      return {
        Success: false,
        Message: `API responded with invalid request: ${
          JSON.parse(await result.readBody()).message
        }`
      }
    }

    if (result.message.statusCode !== 202) {
      return {
        Success: false,
        Message: `Unexpected status code returned from Hava API: '${
          result.message.statusCode
        }' Error from API: ${await result.readBody()}`
      }
    }

    const job = JSON.parse(await result.readBody())

    const jobWaitResult = await waitForJob(job.job_id, client)

    if (!jobWaitResult.Success) {
      return {
        Success: false,
        Message: jobWaitResult.Message
      }
    }

    return {Success: true, Message: jobWaitResult.Message}
  }

  /**
   * Case-sentive validation of supported view types
   *
   *  @param viewType name of the view to validate
   *  @return true if a valid view type, false otherwise
   */
  validateViewType(viewType: string): HavaResult {
    if (!this.viewTypeMap.has(viewType)) {
      const message = `View type '${viewType}' not known, supported values are: ${[
        ...this.viewTypeMap.keys()
      ].join(',')}`

      return {Success: false, Message: message}
    }

    return {Success: true, Message: ''}
  }
}
