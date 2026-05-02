export class World {
  constructor() {
    this.nextEntityId = 1;
    this.entities = new Set();
    this.components = new Map();
  }

  createEntity(initialComponents = {}) {
    const entityId = this.nextEntityId;
    this.nextEntityId += 1;
    this.entities.add(entityId);

    Object.entries(initialComponents).forEach(([componentName, componentData]) => {
      this.addComponent(entityId, componentName, componentData);
    });

    return entityId;
  }

  removeEntity(entityId) {
    this.entities.delete(entityId);

    this.components.forEach((store) => {
      store.delete(entityId);
    });
  }

  addComponent(entityId, componentName, componentData) {
    if (!this.entities.has(entityId)) {
      throw new Error(`Entity ${entityId} does not exist.`);
    }

    if (!this.components.has(componentName)) {
      this.components.set(componentName, new Map());
    }

    this.components.get(componentName).set(entityId, componentData);
  }

  getComponent(entityId, componentName) {
    const store = this.components.get(componentName);
    return store ? store.get(entityId) : undefined;
  }

  getEntitiesWith(componentNames) {
    if (componentNames.length === 0) {
      return [];
    }

    const firstStore = this.components.get(componentNames[0]);
    if (!firstStore) {
      return [];
    }

    const candidateIds = [...firstStore.keys()];
    return candidateIds.filter((entityId) => {
      return componentNames.every((componentName) => {
        const store = this.components.get(componentName);
        return store ? store.has(entityId) : false;
      });
    });
  }
}
