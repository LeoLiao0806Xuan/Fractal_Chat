import { describe, it, expect, beforeEach } from 'vitest'
import { useModelStore } from '../modelStore'

beforeEach(() => {
  useModelStore.setState({ configs: [], activeModelId: null })
})

describe('modelStore', () => {
  describe('addConfig', () => {
    it('adds a config and returns its id', () => {
      const id = useModelStore.getState().addConfig({
        name: 'My Model',
        apiUrl: 'https://api.openai.com',
        apiKey: 'encrypted-key',
        modelName: 'gpt-4o',
      })
      const state = useModelStore.getState()
      expect(state.configs).toHaveLength(1)
      expect(state.configs[0].name).toBe('My Model')
      expect(id).toBeTruthy()
    })

    it('auto-generates createdAt and id', () => {
      const id = useModelStore.getState().addConfig({
        name: 'Test',
        apiUrl: 'https://api.test.com',
        apiKey: 'key',
        modelName: 'test-model',
      })
      const config = useModelStore.getState().configs[0]
      expect(config.id).toBe(id)
      expect(config.createdAt).toBeTruthy()
    })
  })

  describe('removeConfig', () => {
    it('removes a config', () => {
      const id = useModelStore.getState().addConfig({
        name: 'M', apiUrl: 'https://a.com', apiKey: 'k', modelName: 'm',
      })
      useModelStore.getState().removeConfig(id)
      expect(useModelStore.getState().configs).toHaveLength(0)
    })

    it('clears activeModelId if removed config was active', () => {
      const id = useModelStore.getState().addConfig({
        name: 'M', apiUrl: 'https://a.com', apiKey: 'k', modelName: 'm',
      })
      useModelStore.getState().setActiveModel(id)
      useModelStore.getState().removeConfig(id)
      expect(useModelStore.getState().activeModelId).toBeNull()
    })
  })

  describe('setActiveModel / getActiveConfig', () => {
    it('sets and retrieves active model', () => {
      const id = useModelStore.getState().addConfig({
        name: 'M', apiUrl: 'https://a.com', apiKey: 'k', modelName: 'm',
      })
      useModelStore.getState().setActiveModel(id)
      const active = useModelStore.getState().getActiveConfig()
      expect(active?.id).toBe(id)
    })

    it('returns undefined when no active model', () => {
      const active = useModelStore.getState().getActiveConfig()
      expect(active).toBeUndefined()
    })
  })

  describe('updateConfig', () => {
    it('partially updates a config', () => {
      const id = useModelStore.getState().addConfig({
        name: 'Old', apiUrl: 'https://a.com', apiKey: 'k', modelName: 'm',
      })
      useModelStore.getState().updateConfig(id, { name: 'New', modelName: 'gpt-5' })
      const config = useModelStore.getState().configs[0]
      expect(config.name).toBe('New')
      expect(config.modelName).toBe('gpt-5')
      expect(config.apiUrl).toBe('https://a.com') // unchanged
    })
  })
})
