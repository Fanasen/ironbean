import {ComponentType, getDefaultScope, Scope} from "./internals";

interface ISettings {
    componentType?: ComponentType;
    scope?: Scope;
}

export class DependencyToken<TDependency> {
    // @ts-ignore
    a: TDependency;
    private _componentType: ComponentType;
    private _scope: Scope;
    private _name: string;

    private constructor(name: string, componentType: ComponentType, scope: Scope) {
        this._name = name;
        this._scope = scope;
        this._componentType = componentType;
    }

    public static create<TDependency>(name: string, settings: ISettings = {}) {
        return new DependencyToken<TDependency>(name, settings.componentType || ComponentType.Singleton, settings.scope || getDefaultScope());
    }

    get componentType(): ComponentType {
        return this._componentType;
    }

    get scope(): Scope {
        return this._scope;
    }

    get name(): string {
        return this._name;
    }
}