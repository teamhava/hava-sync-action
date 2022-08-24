import {expect, test} from '@jest/globals'
import {checkIfValidPath, validateViewType} from '../src/helpers'

test('Validate checkIfValidPath valid', () => {
  const validPath = [
    '/somepath/name.png',
    'folder/name.png',
    'name.png',
    './somePath.png',
    './folder/name.png'
  ]

  validPath.forEach(p => {
    expect(checkIfValidPath(p).Success).toBe(true)
  })
})

test('Validate checkIfValidPath invalid', () => {
  const validPath = [
    '../somepath/name.png',
    'folder/../name.png',
    'name.pdf',
    'some$ath.png',
    'f$older/name.png'
  ]

  validPath.forEach(p => {
    expect(checkIfValidPath(p).Success).toBe(false)
  })
})

test('Valididate types - valid', async () => {
  const validTestTypes = ['infrastructure', 'security', 'container']

  validTestTypes.forEach(x => {
    expect(validateViewType(x).Success).toBe(true)
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

  validTestTypes.forEach(x => {
    expect(validateViewType(x).Success).toBe(false)
  })
})
