interface State {
}

interface Action {
    type: string;
}

interface Actor {
    (dispatch: Dispatch, getState: GetState): void;
}

interface StateReducer<T extends State> {
    (state: T, action: Action): T;
}

interface Store<T extends State> {
    name: string;
    reducer: StateReducer<T>;
    initialState: T;
}

interface Listener {
    (action: Action, getState: GetState): void;
}

interface GetState {
    (): State;
}

interface Dispatch {
    (actionator: Action | Actor): void;
}

class FluxTs {
    private state: State;
    private reducers: {[key: string]: StateReducer<any>};
    private listeners: Listener[];
    
    public constructor(stores: Store<any>[]) {
        this.state = {};
        this.reducers = {};
        this.listeners = [];
        
        stores.forEach(store => {
            this.state[store.name] = store.initialState;
            this.reducers[store.name] = store.reducer;
        })
    }

    addListener(listener: Listener) {
        var index = this.listeners.indexOf(listener);
        if (index === -1) {
            this.listeners.push(listener);
        }
    }

    removeListener(listener: Listener) {
        var index = this.listeners.indexOf(listener);
        if (index !== -1) {
            this.listeners.splice(index, 1);
        }
    }
    
    getState: GetState = () => {
        return this.state;
    }
    
    dispatch: Dispatch = (actionator: Action | Actor) => {
        if (typeof actionator === "function") {
            var actor = <Actor>actionator;
            actor(this.dispatch, this.getState);
        } else {
            var action = <Action>actionator;
            
            this.state = Object.keys(this.reducers).reduce((next, storeName) => {
                next[storeName] = this.reducers[storeName](this.state[storeName], action);
                return next;
            }, {});
        
            this.listeners.forEach(listener => {
                listener(action, this.getState);
            });
        }
    }
}

    
function bindActionCreators<T>(actionCreators: T, dispatch: Dispatch | FluxTs): T {
    var d: Dispatch = <Dispatch>dispatch;
    if ('dispatch' in dispatch) {
        d = (<FluxTs>dispatch).dispatch;
    }
    return <T>Object.keys(actionCreators).reduce(function(bound, key) {
        var value = actionCreators[key];
        if (typeof key === "function") {
            bound[key] = function() {
                var action = value(arguments);
                d(action);
                return action;
            }
        } else {
            bound[key] = value;
        }
        return bound;
    }, {})
}