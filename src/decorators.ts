import "reflect-metadata";
import {ComponentType, constants} from "./enums";
import {currentContainer, getBaseContainer} from "./container";
import {Scope} from "./scope";
import {DependencyKey} from "./dependencyKey";
import {markAsOverridenDefineProperty} from "./useDefClassFiedsHack";

export type Class = new (...args: any[]) => any;
export function component(componentType: ComponentType): any;
export function component(Class: Class): any;
export function component(ClassOrType: Class | ComponentType): any {
    let componentType = ComponentType.Singleton;
    function decorator(Class: any): any {
        Reflect.defineMetadata(constants.component, true, Class);
        Reflect.defineMetadata(constants.componentType, componentType, Class);

        return Class;
    }

    // @ts-ignore
    if (ClassOrType.prototype) {
        return decorator(ClassOrType);
    }

    // @ts-ignore
    componentType = ClassOrType;

    return decorator;
}

export function scope(scope: Scope): (Class: Class) => any {
    function decorator(Class: any): any {
        Reflect.defineMetadata(constants.scope, scope, Class);

        return Class;
    }

    return decorator;
}

export function autowired(target: any, propertyName: string) {
    const set = () => {};
    const get = function(this: any) {
        const target = this;
        const valueFromCache = Reflect.getMetadata(constants.autowiredCache, target, propertyName)
        if (valueFromCache) {
            return valueFromCache;
        }
        const container = Reflect.getMetadata(constants.container, target) || currentContainer || getBaseContainer();
        const type = Reflect.getMetadata(constants.types, target, propertyName)
            || Reflect.getMetadata("design:type", target, propertyName);

        const value = container.getBean(type);
        Reflect.defineMetadata(constants.autowiredCache, value, target, propertyName)
        return value;
    };

    if (delete target[propertyName]) {
        Object.defineProperty(target, propertyName, {
            get: get,
            set: set,
            enumerable: true,
            configurable: true
        });
        markAsOverridenDefineProperty(target, propertyName);
    }
}

export function type<T>(key: DependencyKey<T>) {
    return function(target: any, propertyName: string | symbol, parameterIndex?: number) {
        if (parameterIndex === undefined) {
            Reflect.defineMetadata(constants.types, key, target, propertyName);
        } else {
            const methodParameters: Object[] = Reflect.getOwnMetadata(constants.types, target, propertyName) || [];
            methodParameters[parameterIndex] = key;
            Reflect.defineMetadata(constants.types, methodParameters, target, propertyName);
        }
    }
}

export function postConstruct<T>(target: T, propertyName: string) {
    Reflect.defineMetadata(constants.postConstruct, true, target, propertyName);
}