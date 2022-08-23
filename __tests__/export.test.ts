import {expect, test} from '@jest/globals'
import {HavaExporter} from '../src/export'

test('Valididate types - valid', async () => {
  const validTestTypes = ['infrastructure', 'security', 'container']

  const exporter = new HavaExporter()

  validTestTypes.forEach(x => {
    expect(exporter.validateViewType(x).Success).toBe(true)
  })
})

test('Valididate types - invalid', async () => {
  const validTestTypes = [
    'Infrastructure',
    'containter',
    'network',
    'architecture',
    'View::Infrastructure'
  ]

  const exporter = new HavaExporter()

  validTestTypes.forEach(x => {
    expect(exporter.validateViewType(x).Success).toBe(false)
  })
})

test('Valid export run', async () => {
  const havaToken = process.env['HAVA_API_TOKEN'] as string
  const envId = process.env['HAVA_ENV_ID'] as string
  const viewType = 'infrastructure'

  const exporter = new HavaExporter()

  const result = await exporter.export({
    EnvironmentID: envId,
    ViewType: viewType,
    HavaToken: havaToken,
    ImagePath: 'test.png'
  })

  expect(result.Success).toBe(true)
}, 10000)
