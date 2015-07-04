interface State {
}

interface Action {
    type: string;
}

// Dispatch one of these for asynchronous activities
interface Actor {
    (dispatch: Dispatch, getState: GetState): void;
}

// Should return initial state when invoked with an undefined state.
// Up to the application architect if they want to mutate the state.
interface Store {
    (state?: State, action?: Action): State;
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

class LeanRedux {
    private state: State;
    private stores: {[key: string]: Store};
    private listeners: Listener[];
    
    public constructor() {
        this.state = {};
        this.stores = {};
        this.listeners = [];
    }
    
    // If a store already exists with this name it will be
    // overridden and its state will be lost.
    addStore(name: string, store: Store) {
        this.stores[name] = store;
        this.state[name] = store();
    }
    
    removeStore(name: string) {
        delete this.stores[name];
        delete this.state[name];
    }
    
    // If this listener has already been added it will not be added
    // again. This prevents repeat calls to the same listener.
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
            this._applyAction(action);
            this._notifyListeners(action);
        }
    }
    
    private _applyAction(action: Action) {
        Object.keys(this.stores).forEach(name => {
            this.state[name] = this.stores[name](action);
        })
    }
    
    private _notifyListeners(action: Action) {
        this.listeners.forEach(listener => {
            listener(action, this.getState);
        })
    }
}