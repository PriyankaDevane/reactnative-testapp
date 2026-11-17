import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import {
  createContext,
  useContext,
  useState,
  useSyncExternalStore,
  type PropsWithChildren,
} from "react";
import { createStore, type StoreApi } from "zustand/vanilla";

interface SubscriptionsState {
  subscriptions: Subscription[];
  addSubscription: (subscription: Subscription) => void;
  updateSubscription: (id: string, changes: Partial<Omit<Subscription, "id">>) => void;
  deleteSubscription: (id: string) => void;
}

const SubscriptionsContext = createContext<StoreApi<SubscriptionsState> | null>(null);

export function SubscriptionsProvider({ children }: PropsWithChildren) {
  const [store] = useState(() =>
    createStore<SubscriptionsState>()((set) => ({
      subscriptions: HOME_SUBSCRIPTIONS,
      addSubscription: (subscription) =>
        set(({ subscriptions }) => ({ subscriptions: [subscription, ...subscriptions] })),
      updateSubscription: (id, changes) =>
        set(({ subscriptions }) => ({
          subscriptions: subscriptions.map((subscription) =>
            subscription.id === id ? { ...subscription, ...changes, id } : subscription,
          ),
        })),
      deleteSubscription: (id) =>
        set(({ subscriptions }) => ({
          subscriptions: subscriptions.filter((subscription) => subscription.id !== id),
        })),
    })),
  );

  return (
    <SubscriptionsContext.Provider value={store}>
      {children}
    </SubscriptionsContext.Provider>
  );
}

export function useSubscriptions() {
  const store = useContext(SubscriptionsContext);
  if (!store) throw new Error("useSubscriptions requires SubscriptionsProvider.");
  return useSyncExternalStore(store.subscribe, store.getState, store.getInitialState);
}
