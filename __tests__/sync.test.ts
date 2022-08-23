import {expect, test} from '@jest/globals'
import {HavaSync} from '../src/sync'

test('Run valid sync', async () => {
  const havaToken = process.env['HAVA_API_TOKEN'] as string
  const sourceId = process.env['HAVA_SOURCE_ID'] as string

  const sync = new HavaSync()

  const syncResult = await sync.syncSource(sourceId, havaToken)

  expect(syncResult.Success).toBe(true)
}, 60000)
