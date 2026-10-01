import { useEffect, useRef, useState } from "react";
import { useApp } from "./ui.js";
export function useViewState(name, initial) {
    const { state, category, viewId } = useApp();
    const key = `sein-view:${state.me.id}:${category.id}:${viewId}:${name}`;
    const read = () => {
        try {
            const value = sessionStorage.getItem(key);
            return value === null
                ? typeof initial === "function"
                    ? initial()
                    : initial
                : JSON.parse(value);
        }
        catch {
            return typeof initial === "function" ? initial() : initial;
        }
    };
    const [value, setValue] = useState(read);
    const activeKey = useRef(key);
    useEffect(() => {
        if (activeKey.current !== key) {
            activeKey.current = key;
            setValue(read());
        }
    }, [key]);
    const update = (next) => setValue((previous) => {
        const result = typeof next === "function" ? next(previous) : next;
        try {
            sessionStorage.setItem(key, JSON.stringify(result));
        }
        catch { }
        return result;
    });
    return [value, update];
}
export function clearViewState() {
    try {
        for (const key of Object.keys(sessionStorage))
            if (key.startsWith("sein-view:"))
                sessionStorage.removeItem(key);
    }
    catch { }
}
export function useResetOnChange(callback, deps) {
    const mounted = useRef(false);
    useEffect(() => {
        if (mounted.current)
            callback();
        else
            mounted.current = true;
    }, deps);
}
export function useUnsaved(dirty) {
    useEffect(() => {
        const warn = (e) => {
            if (dirty) {
                e.preventDefault();
                e.returnValue = "";
            }
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);
}
