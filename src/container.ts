import {component} from "./decorators";
import {ComponentType, constants} from "./enums";
import {TestProvider} from "./testProvider";
import {ApplicationContext, TestingContext} from "./base";
import {DependencyStorage} from "./dependencyStorage";

@component(ComponentType.Singleton)
export class Container {
   protected storage: DependencyStorage = new DependencyStorage();

    init() {
        this.storage.saveInstance(Container, this);
    }

    addDependenceFactory(key: Object, factory: Function) {
        this.storage.saveFactory(key, factory);
    }

    public getClassInstance<T>(Class: new (...any: any[]) => T): T {
        const instance = this.storage.getInstance(Class);

        if (!instance) {
            const type = this.getComponentType(Class);
            const instance = this.buildNewInstance(Class);
            if (type === ComponentType.Singleton) {
                this.storage.saveInstance(Class, instance);
            }
            this.runPostConstruct(instance, Class);
            return instance;
        }

        return instance as T;
    }

    public getByKey(objectKey: Object): any {
        const instance = this.storage.getInstance(objectKey);

        if (!instance) {
            const factory = this.storage.getFactory(objectKey);
            if (!factory) {
                throw new Error("Factory for " + objectKey + "not found.");
            }
            const instance = factory();
            this.storage.saveInstance(objectKey, instance);
            return instance;
        }

        return instance;
    }

    protected getDependencyList(Classes: (new () => Object)[]|undefined, objectKeys: any[] = []) {
        if (!Classes) {
            return [];
        }

        const map = Classes.map((Class, i) => !objectKeys[i] && this.getClassInstance(Class as any));
        if (objectKeys) {
            objectKeys.forEach((obj, index) => {
                if (obj) {
                    map[index] = this.getByKey(obj);
                }
            })
        }

        return map;
    }

    protected getComponentType(Class: new () => any): ComponentType | undefined {
        return Reflect.getMetadata(constants.componentType, Class);
    }

    protected buildNewInstance<T>(Class: new () => T): T {
        const Classes = Reflect.getMetadata("design:paramtypes", Class);
        const objectKeys = Reflect.getMetadata(constants.keys, Class);
        return new (Class as any)(...this.getDependencyList(Classes, objectKeys));
    }

    protected runPostConstruct(instance: any, Class: any) {
        for (let key in Class.prototype) {
            if (Reflect.getMetadata(constants.postConstruct, instance, key)) {
                const Classes = Reflect.getMetadata("design:paramtypes", Class.prototype, key);
                const objectKeys = Reflect.getOwnMetadata(constants.keys, Class.prototype, key);
                (instance[key] as Function).apply(instance, this.getDependencyList(Classes, objectKeys));
            }
        }
    }

    public countOfDependencies(): number {
        return this.storage.countOfDependencies();
    }
}

@component(ComponentType.Singleton)
export class TestContainer extends Container {
    private testProvider!: TestProvider;

    public init() {
        this.storage.saveInstance(TestContainer, this);
    }

    public getClassInstance<T>(Class: new (...any: any[]) => T): T {
        if (<any>Class === ApplicationContext || <any>Class === TestingContext) {
            return super.getClassInstance(TestingContext as any);
        }
        if (<any>Class === Container || <any>Class === TestContainer) {
            return super.getClassInstance(TestContainer as any);
        }

        const instance = this.storage.getInstance(Class);

        if (!instance) {
            const type = this.getComponentType(Class);
            const instance = this.testProvider.mockClass(Class);
            if (type === ComponentType.Singleton) {
                this.storage.saveInstance(Class, instance)
            }
            return instance;
        }

        return instance as T;
    }

    public getClassInstanceWithMocks<T>(Class: new () => T): T {
        return super.getClassInstance(Class);
    }

    public setTestProvider(testProvider: TestProvider) {
        this.testProvider = testProvider;
    }
}

let container: Container | null;
export function getBaseContainer(): Container {
    if (!container) {
        container = new Container();
        container.init();
    }

    return container;
}

export function getTestContainer(): TestContainer {
    if (!container) {
        container = new TestContainer();
        container.init();
    }

    return container as TestContainer;
}

export function destroyContainer(): void {
    container = null;
}
