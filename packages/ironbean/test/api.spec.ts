import {
    ApplicationContext,
    autowired,
    component,
    ComponentContext,
    ComponentType,
    destroyContext,
    getBaseApplicationContext
} from "../src";
import {Container} from "../src/container";
import {containerStorage} from "../src/containerStorage";
import {createComponentContext, IPlugin, registerPlugin} from "../src/api";

describe("api", () => {
    let applicationContext: ApplicationContext;

    beforeEach(() => {
        applicationContext = getBaseApplicationContext();
        expectDependenciesCount(2);
    })

    afterEach(() => {
        expect(containerStorage.currentComponentContainer).toBe(undefined, "currentComponentContainer is not clear")
        containerStorage.dispose();
        destroyContext();
    });

    function expectDependenciesCount(dependenciesCount: number) {
        expect(applicationContext.getBean(Container).countOfDependencies()).toBe(dependenciesCount);
    }

    it("createComponentContext", () => {
        @component(ComponentType.Prototype)
        class a {
            test = "sa";
        }

        @component
        class b {
            @autowired a!: a;
        }

        const context = createComponentContext(applicationContext);

        expect(context.getBean(a)).toBe(context.getBean(a));
        expect(applicationContext.getBean(b)).toBe(context.getBean(b));
    });

    it("plugin getContextForClassInstance", () => {
        const componentContext = createComponentContext(applicationContext);
        class Plugin implements IPlugin {
            getContextForClassInstance(Class: object): ComponentContext | undefined {
                return componentContext;
            }
        }

        registerPlugin(new Plugin());

        @component(ComponentType.Prototype)
        class a {
            test = "sa";
        }

        @component(ComponentType.Prototype)
        class b {
            @autowired a!: a;
        }

        expect(applicationContext.getBean(b).a).toBe(applicationContext.getBean(b).a);
    });

});
