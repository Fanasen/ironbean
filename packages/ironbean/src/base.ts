import {
    Component,
    component,
    ComponentType,
    Container,
    currentContainerAction,
    Dependency,
    destroyContainer,
    FunctionFactory,
    getBaseContainer,
    getTestContainer,
    TClass,
    TestContainer
} from "./internals";

@component(ComponentType.Singleton)
export class ApplicationContext {
    private readonly container: Container;

    constructor(container: Container) {
        this.container = container;
    }

    public getBean<T>(dependency: Dependency<T>): T {
        return this.container.getBean(dependency);
    }

    public provideScope<T>(action: () => T) {
        return currentContainerAction(this.container, action);
    }
}

@component(ComponentType.Singleton)
export class TestingContext extends ApplicationContext {
    private testContainer: TestContainer;

    constructor(container: TestContainer) {
        super(container);
        this.testContainer = container;
    }

    public getBeanWithMocks<T>(dependency: Dependency<T>): T {
        return this.testContainer.getInstanceWithMocks(dependency);
    }

    public setMock<T, K extends T>(dependency: Dependency<T>, classFactory: TClass<K>): void {
        this.testContainer.setMock(dependency, classFactory);
    }

    public setMockFactory<T, K extends T>(dependency: Dependency<T>, factory: FunctionFactory<K>): void {
        this.testContainer.setMockFactory(dependency, factory);
    }

    public disableMock<T>(dependency: Dependency<T>): void {
        return this.testContainer.disableMock(dependency);
    }

    public enableMock<T>(dependency: Dependency<T>): void {
        return this.testContainer.disableMock(dependency, false);
    }

    public getMock<T>(dependency: Dependency<T>): T {
        return this.getBean(dependency);
    }
}

export function getBaseApplicationContext(): ApplicationContext {
    const container = getBaseContainer();
    return container.getBean(ApplicationContext);
}

export function getBaseTestingContext(): TestingContext {
    const container = getTestContainer();
    return container.getBean(TestingContext);
}

export function destroyContext(): void {
    destroyContainer();
}

export const ApplicationContextComponent = Component.create(ApplicationContext);
export const TestingContextComponent = Component.create(TestingContext);