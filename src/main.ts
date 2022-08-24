import {HavaSync} from './sync'
import {HavaExporter, ExporterOptions} from './export'
import * as core from '@actions/core'
import {HavaResult} from './types'

// most @actions toolkit packages have async methods
async function run(): Promise<void> {
  const sourceId: string = core.getInput('source_id')
  const environmentId: string = core.getInput('environment_id')
  const viewType: string = core.getInput('view_type')
  const havaToken: string = core.getInput('hava_token')
  const imagePath: string = core.getInput('image_path')
  const skipExport: boolean = core.getBooleanInput('skip_export')

  const sync: HavaSync = new HavaSync()

  const syncResult: HavaResult = await sync.syncSource(sourceId, havaToken)

  if (!syncResult.Success) {
    core.setFailed(syncResult.Message)
    process.exitCode = core.ExitCode.Failure
  }

  if (!skipExport) {
    const exporter = new HavaExporter()
    const expOptions: ExporterOptions = {
      EnvironmentID: environmentId,
      ViewType: viewType,
      HavaToken: havaToken,
      ImagePath: imagePath
    }

    const expResult: HavaResult = await exporter.export(expOptions)

    if (!expResult.Success) {
      core.setFailed(expResult.Message)
    }
  }

  core.setOutput('path', imagePath)
}

run()
