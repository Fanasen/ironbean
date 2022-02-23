import React, {
    createContext,
    createElement,
    forwardRef,
    FunctionComponent,
    ReactNode,
    useContext,
    useEffect,
    useState
} from "react";
import {ApplicationContext, Dependency, getBaseApplicationContext} from "ironbean";
import {IPlugin, registerPlugin} from "ironbean/dist/api";
import {ComponentContainer} from "ironbean/dist/componentContainer";
import {Container} from "ironbean/dist/container";

export function useBean<T>(dependency: Dependency<T>): T {
    const componentAppContext = useContext(reactContext)
    const getContext = () => componentAppContext ?? getBaseApplicationContext();
    const [instance, setInstance] = useState<T>(() => getContext().getBean(dependency));

    useEffect(() => {
        setInstance(getContext().getBean(dependency));
    }, [componentAppContext])

    return instance;
}

const reactContext = createContext<ApplicationContext|null>(null);

interface IContextProviderProps {
    context: ApplicationContext;
    children: ReactNode;
}

export const ContextProvider: FunctionComponent<IContextProviderProps> = (props) => {
    return createElement(reactContext.Provider, {value: props.context}, props.children);
}

const tajny = Symbol();
const tajny2 = Symbol();
const tajny3 = Symbol();

class Plugin implements IPlugin {
    getComponentContainerForClassInstance(Class: object): ComponentContainer | undefined {
        if (!Class[tajny2]) {
            return undefined;
        }
        if (Class[tajny2] !== Class.props[tajny]) {
            Class[tajny2] = Class.props[tajny];
            Class[tajny3] = new ComponentContainer(Class.props[tajny].getBean(Container));
        }

        return Class[tajny3];
    }
}

registerPlugin(new Plugin());

export function withAutowired(): <T extends React.ComponentClass<any>>(component: T) => T {
    return <T extends React.ComponentClass<P>, P>(component: T) => {
        class b extends component {}

        b[tajny2] = true;

        return forwardRef((props, ref) => {
            const context = useBean(ApplicationContext);
            const p = {...props};
            p[tajny] = context;
            return React.createElement(b as any, p);
        }) as any;
    }
}

